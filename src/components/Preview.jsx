import { useMemo, useRef, useEffect } from 'react'
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'

// 配置 marked
marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    },
  })
)

marked.setOptions({
  gfm: true,
  breaks: true,
})

export default function Preview({ content, fontSize }) {
  const scrollRef = useRef(null)

  const html = useMemo(() => {
    try {
      return marked.parse(content || '')
    } catch {
      return '<p style="color:#f38ba8">渲染出错</p>'
    }
  }, [content])

  return (
    <div className="flex flex-col w-1/2 overflow-hidden bg-[#181825]">
      {/* 预览标头 */}
      <div className="flex items-center h-8 px-4 bg-[#181825] border-b border-[#313244] text-xs text-[#6c7086] shrink-0">
        <span>预览</span>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
      >
        <div
          className="markdown-preview"
          style={{ fontSize: `${fontSize}px` }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  )
}
