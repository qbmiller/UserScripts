import AppKit

// 在 macOS 执行：swift generate.swift <输出目录>。所有界面为功能示意，不是真实截图。
let output = CommandLine.arguments.dropFirst().first ?? "."
let ink = "243D31", green = "315F45", muted = "6B7C70", paper = "F5F7F1"
func color(_ hex: String) -> NSColor {
    let n = UInt32(hex, radix: 16)!
    return NSColor(srgbRed: CGFloat((n >> 16) & 255)/255, green: CGFloat((n >> 8) & 255)/255, blue: CGFloat(n & 255)/255, alpha: 1)
}
func box(_ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat, _ fill: String = "FFFFFF", _ radius: CGFloat = 20) {
    color(fill).setFill()
    NSBezierPath(roundedRect: NSRect(x:x,y:y,width:w,height:h), xRadius:radius,yRadius:radius).fill()
}
func text(_ s: String, _ x: CGFloat, _ y: CGFloat, _ size: CGFloat = 24, _ fill: String = "243D31", _ bold: Bool = false) {
    (s as NSString).draw(at: NSPoint(x:x,y:y), withAttributes:[.font:NSFont.systemFont(ofSize:size,weight:bold ? .semibold : .regular), .foregroundColor:color(fill)])
}
func pill(_ s: String, _ x: CGFloat, _ y: CGFloat, _ w: CGFloat) {
    box(x,y,w,42,"E6EEDF",21); text(s,x+17,y+8,18,green,true)
}
func chrome(_ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat, _ title: String) {
    box(x-2,y-2,w+4,h+4,"DEE5D9",24);box(x,y,w,h)
    box(x,y,w,46,"EAF0E5",20);box(x,y+24,w,22,"EAF0E5",0)
    for (i,c) in ["CF8274","DFC16F","89AA81"].enumerated() { box(x+20+CGFloat(i)*20,y+17,10,10,c,5) }
    text(title,x+96,y+10,17,muted)
}
func base(_ n: String, _ label: String, _ heading: String, _ sub: String) {
    box(0,0,1600,900,paper,0)
    text("xxTools",70,45,28,green,true);text("/  浏览器侧栏工具箱",205,51,20,muted)
    pill(n+"  "+label,70,119,260)
    text(heading,70,187,55,ink,true);text(sub,73,270,25,muted)
    text("功能示意 · 非实际界面截图",70,850,17,muted)
    text("CHROME  /  MV3",1290,850,17,muted)
}
func save(_ name: String, _ draw: @escaping () -> Void) {
    let image = NSImage(size:NSSize(width:1600,height:900),flipped:true) { _ in draw();return true }
    let rep = NSBitmapImageRep(data:image.tiffRepresentation!)!
    try! rep.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:output).appendingPathComponent(name+".png"))
}
save("overview") {
    base("01","随手打开，马上用","常用小工具，就在网页旁边。","处理图片、整理数据、管理书签、增强阅读，一个侧栏就够用。")
    chrome(70,345,950,460,"正在浏览的网页")
    text("专注当前这件事",120,433,35,ink,true)
    text("查资料、写代码、整理内容……",120,490,24,muted)
    for i in 0..<5 { box(120,555+CGFloat(i)*32,CGFloat(690-i*55),10,"E8ECE4",5) }
    pill("网页继续看，工具随手用",120,732,310)
    chrome(1060,345,470,460,"xxTools · 侧栏")
    box(1082,411,426,48,paper,12);text("搜索工具…",1100,423,20,muted)
    let titles = ["图片压缩","JSON 格式化","二维码生成","配置互转","颜色转换","时间戳转换","密码生成","收藏夹"]
    for (i,t) in titles.enumerated() {
        let x:CGFloat = 1082+CGFloat(i%2)*219, y:CGFloat = 483+CGFloat(i/2)*69
        box(x,y,207,55,"F0F4EA",12);text(t,x+17,y+15,20,green,true)
    }
}
save("github-download") {
    base("02","GitHub 勾选下载","只想下载几个文件？勾上就行。","文件和文件夹可以一起选，读取仓库内容，在本机打成 ZIP。")
    chrome(70,345,950,460,"GitHub / 示例仓库")
    text("选择你需要的内容",110,412,27,ink,true)
    for (i,t) in ["src / components","docs / guides","README.md","package.json"].enumerated() {
        let y:CGFloat = 477+CGFloat(i)*62
        box(110,y,870,50,i == 3 ? paper : "EAF2E4",10)
        box(127,y+12,25,25,i == 3 ? "DDE4D7" : green,6)
        if i != 3 { text("✓",131,y+10,20,"FFFFFF",true) }
        text(t,173,y+10,23,ink,i != 3)
    }
    box(110,742,230,43,green,12);text("下载所选内容 ZIP",133,751,20,"FFFFFF",true)
    text("→",1055,530,62,green)
    box(1175,400,355,360,"E4EDDB",26)
    text("ZIP",1281,460,58,green,true);text("保留仓库目录结构",1215,553,24,ink,true)
    text("1. 勾选文件 / 文件夹",1210,615,22,muted)
    text("2. 打开下载任务页",1210,660,22,muted)
    text("3. 本机打包并保存",1210,705,22,muted)
}
save("reading") {
    base("03","知乎 / 公众号阅读","长文章有目录，阅读更顺手。","按章节跳转、跟随阅读位置高亮；公众号还支持图片放大与字号设置。")
    chrome(70,345,1460,460,"文章阅读 · 功能示意")
    box(98,417,305,354,paper,18);text("文章目录",123,443,25,green,true)
    let headings = ["01  从这里开始","02  核心思路","03  实践方法","04  小结"]
    for (i,t) in headings.enumerated() {
        let y:CGFloat = 507+CGFloat(i)*55
        if i == 1 { box(113,y-3,273,46,"DDEBD5",10) }
        text(t,130,y+5,22,i == 1 ? green : muted,i == 1)
    }
    text("02  核心思路",465,431,35,ink,true)
    for i in 0..<4 { box(465,505+CGFloat(i)*29,CGFloat(600-i*35),9,"E1E7DC",4) }
    box(465,644,610,113,"EAF0E3",16);text("章节跳转 · 阅读位置高亮",494,685,27,green,true)
    box(1130,417,368,354,"EEF3E7",18)
    text("公众号阅读增强",1162,449,26,green,true)
    for (i,t) in ["目录与章节折叠","点击图片查看大图","正文与目录字号设置","完整网址转为链接"].enumerated() {
        text("✓  "+t,1162,514+CGFloat(i)*53,22,ink)
    }
}
save("local-tools") {
    base("04","图片 / 数据 / 设计","那些琐碎的小操作，在这里一次搞定。","常用处理在本机完成：图片不上传，文本不用粘贴到陌生网站。")
    let xs:[CGFloat] = [70,566,1062]
    let titles = ["图片处理","开发辅助","设计与日常"]
    let subs = ["批量压缩 · 格式转换 · 缩小尺寸","格式化 · 配置互转 · 编解码","屏幕取色 · 二维码 · 随机密码"]
    for i in 0..<3 {
        box(xs[i],355,468,450,"FFFFFF",24)
        text(titles[i],xs[i]+30,390,30,green,true)
        text(subs[i],xs[i]+30,443,20,muted)
    }
    box(100,503,408,180,"E8EEDF",16)
    box(120,523,143,140,"C3D4B2",12);text("JPG",150,568,31,green,true)
    text("→",280,565,35,green);box(340,548,143,90,"D7E3CC",12);text("WebP",364,575,29,green,true)
    text("质量、尺寸、格式按需调整",100,714,23,ink,true)
    text("支持单张或 ZIP 下载",100,752,20,muted)
    box(596,503,408,180,"F1F5EC",16)
    text("JSON   ⇄   YAML",618,532,30,green,true)
    text("        ⇅",618,578,27,green)
    text("Java Properties",618,624,29,green,true)
    text("还有 JWT、时间戳、HTML / CSS / JS",596,715,20,ink,true)
    text("输入与结果，随手复制使用",596,752,20,muted)
    for (i,c) in ["315F45","8CAC73","D1A565","72979E","B7AA8A"].enumerated() { box(1092+CGFloat(i)*77,512,65,75,c,12) }
    text("HEX   /   RGB   /   HSL",1092,621,27,green,true)
    text("颜色转换、二维码样式与下载",1092,714,23,ink,true)
    text("密码可自选长度和字符类型",1092,752,20,muted)
}
