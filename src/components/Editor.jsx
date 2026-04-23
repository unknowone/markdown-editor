import { useRef } from 'react'

export default function Editor({ content, onChange, fontSize, showPreview, currentFilePath }) {
  const textareaRef = useRef(null)

  // 在光标处插入文本
  const insertAtCursor = (text) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const newVal = content.substring(0, start) + text + content.substring(end)
    onChange(newVal)
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = start + text.length
        textareaRef.current.selectionEnd = start + text.length
        textareaRef.current.focus()
      }
    })
  }

  // Tab 键插入 2 空格
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      insertAtCursor('  ')
    }
  }

  // 粘贴事件：识别图片并保存
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (!file) continue

        const buffer = await file.arrayBuffer()
        const ext = (item.type.split('/')[1] || 'png').replace('jpeg', 'jpg')

        if (window.electronAPI?.saveImage) {
          const res = await window.electronAPI.saveImage({
            buffer: new Uint8Array(buffer),
            ext,
            currentFilePath,
          })
          if (res.success) {
            const altText = file.name && file.name !== 'image.png' ? file.name : 'image'
            insertAtCursor(`![${altText}](${res.relativePath})`)
          } else {
            console.error('保存图片失败：', res.error)
          }
        } else {
          // Web 模式降级：使用 base64 内联
          const reader = new FileReader()
          reader.onload = () => insertAtCursor(`![image](${reader.result})`)
          reader.readAsDataURL(file)
        }
        return
      }
    }
  }

  return (
    <div
      className={`flex flex-col overflow-hidden bg-[#1e1e2e] ${
        showPreview ? 'w-1/2 border-r border-[#313244]' : 'flex-1'
      }`}
    >
      {/* 编辑器标头 */}
      <div className="flex items-center h-8 px-4 bg-[#181825] border-b border-[#313244] text-xs text-[#6c7086] shrink-0">
        <span>编辑</span>
      </div>
      <textarea
        ref={textareaRef}
        className="editor-textarea flex-1"
        style={{ fontSize: `${fontSize}px` }}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        spellCheck={false}
        placeholder="开始输入 Markdown…（支持粘贴图片）"
      />
    </div>
  )
}
