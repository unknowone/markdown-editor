import { useMemo, useRef, useState, useEffect } from 'react'
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

// 将相对路径转成 file:// 绝对路径（供 Electron 本地图片渲染）
function resolveImageSrc(src, currentFilePath) {
  if (!src) return src
  // 已是完整 URL（http/https/data/file）直接返回
  if (/^(https?:|data:|file:|blob:)/i.test(src)) return src
  // 绝对路径
  if (src.startsWith('/')) return `file://${src}`
  // 相对路径：需要 currentFilePath 作为基准
  if (currentFilePath) {
    const dir = currentFilePath.replace(/[^/]+$/, '')
    return `file://${dir}${src}`
  }
  return src
}

export default function Preview({ content, fontSize, currentFilePath }) {
  const scrollRef = useRef(null)
  const [lightboxSrc, setLightboxSrc] = useState(null)

  // 自定义 renderer：改写图片 src
  const html = useMemo(() => {
    const renderer = new marked.Renderer()
    const originalImage = renderer.image.bind(renderer)
    renderer.image = ({ href, title, text }) => {
      const resolved = resolveImageSrc(href, currentFilePath)
      const titleAttr = title ? ` title="${title}"` : ''
      return `<img src="${resolved}" alt="${text || ''}"${titleAttr} class="md-img" />`
    }
    try {
      return marked.parse(content || '', { renderer })
    } catch {
      return '<p style="color:#f38ba8">渲染出错</p>'
    }
  }, [content, currentFilePath])

  // 双击图片放大
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const handler = (e) => {
      if (e.target.tagName === 'IMG' && e.target.classList.contains('md-img')) {
        setLightboxSrc(e.target.src)
      }
    }
    container.addEventListener('dblclick', handler)
    return () => container.removeEventListener('dblclick', handler)
  }, [html])

  // ESC 关闭 Lightbox
  useEffect(() => {
    if (!lightboxSrc) return
    const onKey = (e) => { if (e.key === 'Escape') setLightboxSrc(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxSrc])

  return (
    <div className="flex flex-col w-1/2 overflow-hidden bg-[#181825] relative">
      {/* 预览标头 */}
      <div className="flex items-center h-8 px-4 bg-[#181825] border-b border-[#313244] text-xs text-[#6c7086] shrink-0">
        <span>预览（双击图片放大）</span>
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

      {/* 图片 Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setLightboxSrc(null)}
        >
          <img
            src={lightboxSrc}
            alt=""
            className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white text-3xl leading-none"
            onClick={() => setLightboxSrc(null)}
            title="关闭 (ESC)"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
