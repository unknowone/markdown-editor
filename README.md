# Markdown Editor

一款专为 macOS 设计的个人 Markdown 可视化编辑器，基于 Electron + React 构建。

![Platform](https://img.shields.io/badge/platform-macOS-lightgrey?logo=apple)
![Electron](https://img.shields.io/badge/Electron-31-47848F?logo=electron)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![License](https://img.shields.io/badge/license-MIT-green)

## 截图

> 左侧实时编辑，右侧即时渲染预览，支持文件管理与目录导航。

## 功能特性

- **实时预览** — 左右分屏，编辑即时同步渲染
- **语法高亮** — 基于 highlight.js，支持数十种编程语言
- **文件管理** — 侧边栏浏览本地文件夹，支持多级目录展开
- **目录导航** — 自动提取文档标题，一键跳转
- **字号调节** — 工具栏实时调整编辑器与预览字号
- **macOS 原生体验** — 隐藏标题栏、毛玻璃效果、系统菜单集成

## 快捷键

| 功能         | 快捷键        |
|--------------|-------------|
| 新建文件     | `⌘ N`       |
| 打开文件     | `⌘ O`       |
| 打开文件夹   | `⌘ ⇧ O`    |
| 保存         | `⌘ S`       |
| 另存为       | `⌘ ⇧ S`    |
| 切换侧边栏   | `⌘ B`       |
| 切换预览     | `⌘ P`       |

## 技术栈

| 模块 | 技术 |
|------|------|
| 桌面壳 | [Electron](https://www.electronjs.org/) 31 |
| UI 框架 | [React](https://react.dev/) 18 |
| 样式 | [Tailwind CSS](https://tailwindcss.com/) 3 |
| Markdown 渲染 | [marked](https://marked.js.org/) + [marked-highlight](https://github.com/markedjs/marked-highlight) |
| 代码高亮 | [highlight.js](https://highlightjs.org/) |
| 图标 | [lucide-react](https://lucide.dev/) |
| 构建工具 | [Vite](https://vitejs.dev/) 5 |
| 打包工具 | [electron-builder](https://www.electron.build/) |

## 本地开发

### 环境要求

- Node.js ≥ 18
- macOS（打包 `.dmg` 必须在 macOS 上执行）

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/unknowone/markdown-editor.git
cd markdown-editor

# 安装依赖
npm install

# 开发模式（同时启动 Vite Dev Server + Electron）
npm run dev
```

### 打包为 macOS 应用

```bash
npm run build
```

产物路径：`release/Markdown Editor-1.0.0.dmg`

> 首次打开 `.dmg` 安装后，如提示"无法验证开发者"，右键点击应用 → 打开 即可绕过 Gatekeeper。

## 项目结构

```
markdown-editor/
├── electron/
│   ├── main.js          # 主进程：窗口、菜单、文件 IPC
│   └── preload.js       # 安全桥接层
├── src/
│   ├── App.jsx          # 主布局
│   ├── components/
│   │   ├── Editor.jsx          # Markdown 编辑器
│   │   ├── Preview.jsx         # 实时预览
│   │   ├── Sidebar.jsx         # 文件树侧边栏
│   │   ├── Toolbar.jsx         # 工具栏
│   │   └── TableOfContents.jsx # 目录导航
│   ├── hooks/
│   │   └── useFileSystem.js    # 文件系统 Hook
│   └── styles/
│       └── index.css           # 全局样式
├── package.json
└── vite.config.js
```

## License

[MIT](./LICENSE)
