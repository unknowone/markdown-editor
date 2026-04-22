import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Editor from './components/Editor.jsx'
import Preview from './components/Preview.jsx'
import Toolbar from './components/Toolbar.jsx'
import TableOfContents from './components/TableOfContents.jsx'
import { useFileSystem } from './hooks/useFileSystem.js'

const DEFAULT_CONTENT = `# 欢迎使用 Markdown Editor

这是一款专为 macOS 设计的 Markdown 编辑器。

## 功能特性

- **实时预览** — 左侧编辑，右侧即时渲染
- **文件管理** — 侧边栏浏览本地文件夹
- **代码高亮** — 支持多种编程语言
- **目录导航** — 自动提取标题生成目录

## 快速开始

使用 \`⌘O\` 打开文件，\`⌘S\` 保存，\`⌘B\` 切换侧边栏。

## 代码示例

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`
}

console.log(greet('World'))
\`\`\`

## 表格

| 功能     | 快捷键       |
|----------|------------|
| 新建文件 | \`⌘N\`      |
| 打开文件 | \`⌘O\`      |
| 保存     | \`⌘S\`      |
| 切换侧边栏 | \`⌘B\`    |
| 切换预览 | \`⌘P\`      |

> 💡 提示：在偏好设置中可以调整字体大小和主题。

---

开始编辑吧！
`

export default function App() {
  const [content, setContent] = useState(DEFAULT_CONTENT)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showPreview, setShowPreview] = useState(true)
  const [showToc, setShowToc] = useState(false)
  const [currentFilePath, setCurrentFilePath] = useState(null)
  const [isDirty, setIsDirty] = useState(false)
  const [fontSize, setFontSize] = useState(14)

  const { openFile, saveFile, saveFileAs, openFolder, currentFolder, folderTree } = useFileSystem()

  // 加载文件内容
  const loadFile = useCallback(async (filePath) => {
    if (!window.electronAPI) return
    const result = await window.electronAPI.readFile(filePath)
    if (result.success) {
      setContent(result.content)
      setCurrentFilePath(filePath)
      setIsDirty(false)
    }
  }, [])

  // 保存当前文件
  const handleSave = useCallback(async () => {
    if (!window.electronAPI) return
    if (currentFilePath) {
      await window.electronAPI.writeFile(currentFilePath, content)
      setIsDirty(false)
    } else {
      const result = await window.electronAPI.saveFileDialog('untitled.md')
      if (!result.canceled) {
        await window.electronAPI.writeFile(result.filePath, content)
        setCurrentFilePath(result.filePath)
        setIsDirty(false)
      }
    }
  }, [currentFilePath, content])

  // 另存为
  const handleSaveAs = useCallback(async () => {
    if (!window.electronAPI) return
    const name = currentFilePath ? currentFilePath.split('/').pop() : 'untitled.md'
    const result = await window.electronAPI.saveFileDialog(name)
    if (!result.canceled) {
      await window.electronAPI.writeFile(result.filePath, content)
      setCurrentFilePath(result.filePath)
      setIsDirty(false)
    }
  }, [currentFilePath, content])

  // 打开文件对话框
  const handleOpenFile = useCallback(async () => {
    if (!window.electronAPI) return
    const result = await window.electronAPI.openFileDialog()
    if (!result.canceled) {
      await loadFile(result.filePath)
    }
  }, [loadFile])

  // 新建文件
  const handleNewFile = useCallback(() => {
    setContent('')
    setCurrentFilePath(null)
    setIsDirty(false)
  }, [])

  // 注册菜单事件
  useEffect(() => {
    if (!window.electronAPI) return
    const cleanups = [
      window.electronAPI.onMenuEvent('menu:new-file', handleNewFile),
      window.electronAPI.onMenuEvent('menu:open-file', handleOpenFile),
      window.electronAPI.onMenuEvent('menu:open-folder', async () => {
        const result = await window.electronAPI.openFolderDialog()
        if (!result.canceled) openFolder(result.dirPath)
      }),
      window.electronAPI.onMenuEvent('menu:save', handleSave),
      window.electronAPI.onMenuEvent('menu:save-as', handleSaveAs),
      window.electronAPI.onMenuEvent('menu:toggle-sidebar', () => setShowSidebar(v => !v)),
      window.electronAPI.onMenuEvent('menu:toggle-preview', () => setShowPreview(v => !v)),
      // 双击 .md 文件直接打开
      window.electronAPI.onMenuEvent('open-file', (_e, filePath) => loadFile(filePath)),
    ]
    return () => cleanups.forEach(fn => fn && fn())
  }, [handleNewFile, handleOpenFile, handleSave, handleSaveAs, openFolder])

  // 键盘快捷键（Web 模式下备用）
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 's') { e.preventDefault(); handleSave() }
        if (e.key === 'n') { e.preventDefault(); handleNewFile() }
        if (e.key === 'o') { e.preventDefault(); handleOpenFile() }
        if (e.key === 'b') { e.preventDefault(); setShowSidebar(v => !v) }
        if (e.key === 'p') { e.preventDefault(); setShowPreview(v => !v) }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleSave, handleNewFile, handleOpenFile])

  const handleContentChange = (val) => {
    setContent(val)
    setIsDirty(true)
  }

  // 当前文件名
  const fileName = currentFilePath
    ? currentFilePath.split('/').pop()
    : '未命名文件.md'

  return (
    <div className="flex flex-col h-screen bg-[#1e1e2e]">
      {/* 标题栏 */}
      <div className="titlebar-drag flex items-center h-10 px-4 bg-[#181825] border-b border-[#313244] shrink-0">
        <div className="titlebar-no-drag flex items-center gap-2 mr-4 w-16">
          {/* macOS traffic lights 占位 */}
        </div>
        <div className="flex-1 flex items-center justify-center gap-2 titlebar-no-drag">
          <span className="text-sm text-[#a6adc8] font-medium">
            {isDirty ? '● ' : ''}{fileName}
          </span>
        </div>
        <Toolbar
          showSidebar={showSidebar}
          showPreview={showPreview}
          showToc={showToc}
          fontSize={fontSize}
          isDirty={isDirty}
          onToggleSidebar={() => setShowSidebar(v => !v)}
          onTogglePreview={() => setShowPreview(v => !v)}
          onToggleToc={() => setShowToc(v => !v)}
          onSave={handleSave}
          onNewFile={handleNewFile}
          onOpenFile={handleOpenFile}
          onFontSizeChange={setFontSize}
        />
      </div>

      {/* 主体 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 */}
        {showSidebar && (
          <Sidebar
            folderTree={folderTree}
            currentFilePath={currentFilePath}
            onFileSelect={loadFile}
            onOpenFolder={async () => {
              if (window.electronAPI) {
                const result = await window.electronAPI.openFolderDialog()
                if (!result.canceled) openFolder(result.dirPath)
              }
            }}
          />
        )}

        {/* 编辑区 */}
        <div className={`flex flex-1 overflow-hidden ${!showPreview ? '' : ''}`}>
          <Editor
            content={content}
            onChange={handleContentChange}
            fontSize={fontSize}
            showPreview={showPreview}
          />

          {showPreview && (
            <Preview content={content} fontSize={fontSize} />
          )}
        </div>

        {/* 目录面板 */}
        {showToc && (
          <TableOfContents content={content} />
        )}
      </div>
    </div>
  )
}
