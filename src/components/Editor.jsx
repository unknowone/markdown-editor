import { useRef, useEffect } from 'react'

export default function Editor({ content, onChange, fontSize, showPreview }) {
  const textareaRef = useRef(null)

  // Tab 键插入 2 空格
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.target.selectionStart
      const end = e.target.selectionEnd
      const newVal = content.substring(0, start) + '  ' + content.substring(end)
      onChange(newVal)
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 2
          textareaRef.current.selectionEnd = start + 2
        }
      })
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
        spellCheck={false}
        placeholder="开始输入 Markdown…"
      />
    </div>
  )
}
