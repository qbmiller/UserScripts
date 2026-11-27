export type OutputFormat = "jpeg" | "png" | "webp";
export interface CompressionOptions {
  format: OutputFormat | "original";
  quality: number;
  maxEdge: number;
}
export interface CompressionResult {
  blob: Blob;
  width: number;
  height: number;
  format: OutputFormat;
}

// 每张图片使用独立 Worker：取消可立即终止，完成后释放 WASM 线性内存。
export function createCompressor() {
  let abort: (() => void) | undefined;
  return {
    compress(
      file: File,
      options: CompressionOptions,
      onStage: (stage: string) => void,
    ) {
      abort?.();
      return new Promise<CompressionResult>((resolve, reject) => {
        const worker = new Worker(
          new URL("./compress.worker.ts", import.meta.url),
          { type: "module" },
        );
        let timer: ReturnType<typeof setTimeout>;
        const finish = (result?: CompressionResult, error?: Error) => {
          clearTimeout(timer);
          worker.terminate();
          abort = undefined;
          if (error) reject(error);
          else resolve(result!);
        };
        abort = () =>
          finish(undefined, new DOMException("已取消", "AbortError"));
        timer = setTimeout(
          () =>
            finish(undefined, new Error("处理超过两分钟，请缩小图片后重试。")),
          120_000,
        );
        worker.onmessage = ({ data }) => {
          if (data.stage) onStage(data.stage);
          else if (data.error) finish(undefined, new Error(data.error));
          else if (data.result) finish(data.result);
        };
        worker.onerror = (event) => {
          event.preventDefault();
          finish(
            undefined,
            new Error("压缩器加载失败，请重新加载扩展后重试。"),
          );
        };
        worker.onmessageerror = () =>
          finish(undefined, new Error("无法读取压缩结果。"));
        worker.postMessage({ file, options });
      });
    },
    cancel() {
      abort?.();
    },
  };
}
