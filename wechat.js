// ==UserScript==
// @name         微信公众号图文编辑器 - 粘贴图片上传
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  在微信公众号图文编辑器(type=10)中支持直接粘贴剪贴板图片
// @author       Claude
// @match        https://mp.weixin.qq.com/cgi-bin/appmsg*
// @match        https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2*
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @connect      mp.weixin.qq.com
// @connect      mmbiz.qpic.cn
// ==/UserScript==

(function() {
    'use strict';

    // ==================== 配置 ====================
    const CONFIG = {
        // 上传接口
        uploadUrl: '/cgi-bin/filetransfer',
        // 支持的图片类型
        supportedTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/bmp'],
        // 最大文件大小 (10MB)
        maxFileSize: 10 * 1024 * 1024,
        // 上传重试次数
        maxRetries: 3,
        // 上传超时时间
        timeout: 60000
    };

    // ==================== 工具函数 ====================

    /**
     * 获取认证参数
     */
    function getAuthParams() {
        const wxData = window.wx?.data || {};
        const urlParams = new URLSearchParams(window.location.search);

        return {
            token: urlParams.get('token') || wxData.t || '',
            ticket_id: wxData.user_name || '',
            ticket: wxData.ticket || '',
            svr_time: wxData.time || ''
        };
    }

    /**
     * 构造完整的上传URL
     * @param {number} scene - 场景值，图文编辑器使用 5
     */
    function buildUploadUrl(scene = 5) {
        const auth = getAuthParams();
        let url = `${CONFIG.uploadUrl}?action=upload_material&f=json&scene=${scene}`;

        // 添加图文编辑器必需参数
        url += '&writetype=doublewrite&groupid=1';

        // 添加认证参数
        if (auth.ticket_id) url += `&ticket_id=${encodeURIComponent(auth.ticket_id)}`;
        if (auth.ticket) url += `&ticket=${encodeURIComponent(auth.ticket)}`;
        if (auth.svr_time) url += `&svr_time=${auth.svr_time}`;

        return url;
    }

    /**
     * 将图片转换为指定格式
     */
    async function convertImage(blob, maxWidth = 2048, quality = 0.9) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                // 如果图片尺寸在范围内，直接返回原blob
                if (img.width <= maxWidth && img.height <= maxWidth) {
                    resolve(blob);
                    return;
                }

                // 计算缩放比例
                const scale = Math.min(maxWidth / img.width, maxWidth / img.height);
                const width = Math.round(img.width * scale);
                const height = Math.round(img.height * scale);

                // 创建canvas进行缩放
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // 转换为blob
                canvas.toBlob(
                    (newBlob) => {
                        URL.revokeObjectURL(img.src);
                        resolve(newBlob || blob);
                    },
                    blob.type === 'image/png' ? 'image/png' : 'image/jpeg',
                    quality
                );
            };
            img.onerror = () => {
                URL.revokeObjectURL(img.src);
                reject(new Error('图片加载失败'));
            };
            img.src = URL.createObjectURL(blob);
        });
    }

    /**
     * 上传图片到微信服务器
     */
    async function uploadImage(blob, retryCount = 0) {
        const url = buildUploadUrl();

        // 检查文件大小
        if (blob.size > CONFIG.maxFileSize) {
            // 尝试压缩图片
            try {
                blob = await convertImage(blob, 1920, 0.8);
                if (blob.size > CONFIG.maxFileSize) {
                    throw new Error(`图片大小超过限制 (${(blob.size / 1024 / 1024).toFixed(2)}MB > 10MB)`);
                }
            } catch (e) {
                throw new Error('图片压缩失败: ' + e.message);
            }
        }

        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('id', blob.name || 'clipboard_image.png');
            formData.append('name', blob.name || 'clipboard_image.png');
            formData.append('type', blob.type);
            formData.append('lastModifiedDate', new Date().toString());
            formData.append('size', blob.size);
            formData.append('file', blob, blob.name || 'clipboard_image.png');

            GM_xmlhttpRequest({
                method: 'POST',
                url: url,
                data: formData,
                timeout: CONFIG.timeout,
                onload: function(response) {
                    try {
                        const result = JSON.parse(response.responseText);
                        if (result.base_resp && result.base_resp.ret === 0) {
                            resolve(result);
                        } else {
                            const errorMsg = getErrorMessage(result.base_resp?.ret);
                            reject(new Error(errorMsg));
                        }
                    } catch (e) {
                        reject(new Error('解析响应失败: ' + e.message));
                    }
                },
                onerror: function(error) {
                    if (retryCount < CONFIG.maxRetries) {
                        console.log(`上传失败，重试中... (${retryCount + 1}/${CONFIG.maxRetries})`);
                        setTimeout(() => {
                            uploadImage(blob, retryCount + 1).then(resolve).catch(reject);
                        }, 1000 * (retryCount + 1));
                    } else {
                        reject(new Error('网络请求失败'));
                    }
                },
                ontimeout: function() {
                    reject(new Error('上传超时'));
                }
            });
        });
    }

    /**
     * 获取错误信息
     */
    function getErrorMessage(ret) {
        const errorMap = {
            '-18': '页面已过期，请刷新页面后重试',
            '200018': '页面已过期，请刷新页面后重试',
            '-20': '图片无法识别，请使用其他图片或截图',
            '200020': '图片无法识别，请使用其他图片或截图',
            '-13': '上传间隔太短，请稍后重试',
            '200013': '上传间隔太短，请稍后重试',
            '-10': '文件过大，无法上传',
            '200010': '文件过大，无法上传',
            '-22': '音频文件长度不能超过60秒',
            '200022': '音频文件长度不能超过60秒'
        };
        return errorMap[ret] || `上传失败 (错误码: ${ret})`;
    }

    /**
     * 获取图片的宽度高度
     */
    async function getImageDimensions(blob) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                resolve({ width: img.width, height: img.height });
                URL.revokeObjectURL(img.src);
            };
            img.onerror = () => {
                resolve({ width: 0, height: 0 });
                URL.revokeObjectURL(img.src);
            };
            img.src = URL.createObjectURL(blob);
        });
    }

    /**
     * 插入图片到图文编辑器 (type=10 图文消息)
     */
    function insertImageToEditor(result, blob) {
        const fileId = result.content;
        const cdnUrl = result.cdn_url;

        if (!cdnUrl || !fileId) {
            throw new Error('上传响应缺少必要的图片信息');
        }

        // 方法1: 尝试直接操作Vue组件数据
        const imageSelector = document.querySelector('.image-selector');

        if (imageSelector && imageSelector.__vue__) {
            const vm = imageSelector.__vue__;

            // 检查是否超过最大图片数量
            const currentCount = vm.innerList?.length || 0;
            const maxCount = 20;

            if (currentCount >= maxCount) {
                throw new Error('最多只能添加20张图片');
            }

            // 获取图片尺寸
            getImageDimensions(blob).then(dims => {
                // 添加到 innerList
                const newItem = {
                    file_id: fileId * 1,  // 转为数字
                    cdn_url: cdnUrl,
                    url: cdnUrl,
                    loading: false,
                    width: dims.width,
                    height: dims.height
                };

                vm.innerList.push(newItem);

                // 触发Vue的响应式更新
                vm.$forceUpdate();
                vm.$emit('change', vm.innerList);

                console.log('图片已添加到编辑器:', newItem);
            });

            return true;
        }

        // 方法2: 尝试找到图片上传组件的替代方式
        const uploadBtn = document.querySelector('.weui-desktop-upload');
        if (uploadBtn) {
            // 创建一个模拟的上传成功事件
            console.log('图片上传成功，请查看素材库:', cdnUrl);

            // 尝试提示用户
            showNotification('图片已上传，请刷新页面或从素材库选择', 'warning');
            return false;
        }

        console.log('图片上传成功:', { fileId, cdnUrl });
        return false;
    }

    /**
     * 显示上传状态提示
     */
    function showNotification(message, type = 'info') {
        // 创建自定义提示元素
        let toast = document.getElementById('mp-paste-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'mp-paste-toast';
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                padding: 12px 24px;
                border-radius: 4px;
                font-size: 14px;
                color: #fff;
                z-index: 99999;
                transition: opacity 0.3s;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            `;
            document.body.appendChild(toast);
        }

        const colors = {
            info: '#1890ff',
            success: '#52c41a',
            error: '#ff4d4f',
            warning: '#faad14'
        };

        toast.style.backgroundColor = colors[type] || colors.info;
        toast.textContent = message;
        toast.style.opacity = '1';

        setTimeout(() => {
            toast.style.opacity = '0';
        }, 3000);
    }

    /**
     * 显示上传进度
     */
    function showUploadProgress() {
        let progress = document.getElementById('mp-paste-progress');
        if (!progress) {
            progress = document.createElement('div');
            progress.id = 'mp-paste-progress';
            progress.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 3px;
                background: transparent;
                z-index: 99999;
            `;
            progress.innerHTML = `
                <div id="mp-paste-progress-bar" style="
                    width: 0%;
                    height: 100%;
                    background: linear-gradient(90deg, #1890ff, #36cfc9);
                    transition: width 0.3s;
                "></div>
            `;
            document.body.appendChild(progress);
        }
        return progress.querySelector('#mp-paste-progress-bar');
    }

    /**
     * 处理剪贴板粘贴事件
     */
    async function handlePaste(event) {
        // 检查是否在图文编辑器页面
        if (!window.location.href.includes('type=10') &&
            !window.location.href.includes('appmsg_edit_v2')) {
            return;
        }

        // 检查是否正在编辑输入框（避免干扰正常粘贴）
        const activeElement = document.activeElement;
        if (activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable
        )) {
            // 如果是标题输入框，不处理
            if (activeElement.closest('.title_input, [class*="title"]')) {
                return;
            }
        }

        const items = event.clipboardData?.items;
        if (!items) return;

        // 查找图片项
        let imageItem = null;
        for (let i = 0; i < items.length; i++) {
            if (CONFIG.supportedTypes.includes(items[i].type)) {
                imageItem = items[i];
                break;
            }
        }

        if (!imageItem) return;

        // 阻止默认粘贴行为
        event.preventDefault();
        event.stopPropagation();

        const blob = imageItem.getAsFile();
        if (!blob) return;

        // 验证图片类型
        if (!CONFIG.supportedTypes.includes(blob.type)) {
            showNotification('不支持的图片格式，请使用 PNG、JPG、GIF、WebP 格式', 'error');
            return;
        }

        console.log('开始上传剪贴板图片:', blob.type, blob.size);

        // 显示上传提示
        showNotification('正在上传图片...', 'info');
        const progressBar = showUploadProgress();
        progressBar.style.width = '30%';

        try {
            // 上传图片
            const result = await uploadImage(blob);
            progressBar.style.width = '100%';

            console.log('上传响应:', result);

            // 插入图片到编辑器
            const inserted = insertImageToEditor(result, blob);

            if (inserted) {
                showNotification('图片上传成功！', 'success');
            }
        } catch (error) {
            console.error('图片上传失败:', error);
            showNotification('上传失败: ' + error.message, 'error');
        } finally {
            // 隐藏进度条
            setTimeout(() => {
                const progress = document.getElementById('mp-paste-progress');
                if (progress) {
                    progress.style.opacity = '0';
                    setTimeout(() => progress.remove(), 300);
                }
            }, 500);
        }
    }

    // ==================== 初始化 ====================

    /**
     * 检查是否在正确的编辑器页面
     */
    function isEditorPage() {
        const url = window.location.href;
        return url.includes('type=10') || url.includes('appmsg_edit_v2');
    }

    /**
     * 初始化脚本
     */
    function init() {
        if (!isEditorPage()) {
            console.log('不在图文编辑器页面，脚本不启用');
            return;
        }

        // 检查必要的全局对象
        if (typeof window.wx === 'undefined') {
            console.warn('wx对象未定义，脚本可能无法正常工作');
        }

        // 监听粘贴事件
        document.addEventListener('paste', handlePaste, true);

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            /* 上传提示样式 */
            #mp-paste-toast {
                animation: fadeIn 0.3s ease;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }

            /* 进度条样式 */
            #mp-paste-progress {
                animation: slideIn 0.3s ease;
            }
        `;
        document.head.appendChild(style);

        console.log('微信公众号图文编辑器粘贴图片脚本已启用');
        showNotification('粘贴图片功能已启用，可直接 Ctrl+V 粘贴图片', 'success');
    }

    // 等待页面完全加载
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // 延迟初始化，确保wx对象已加载
        setTimeout(init, 1000);
    }

})();
