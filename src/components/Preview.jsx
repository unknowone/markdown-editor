import { useMemo, useRef, useState, useEffect } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
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
  if (/^(https?:|data:|file:|blob:)/i.test(src)) return src
  if (src.startsWith('/')) return `file://${src}`
  if (currentFilePath) {
    const dir = currentFilePath.replace(/[^/]+$/, '')
    return `file://${dir}${src}`
  }
  return src
}

export default function Preview({ content, fontSize, currentFilePath, splitRatio, isFullscreen, onToggleFullscreen }) {
  const scrollRef = useRef(null)
  const [lightboxSrc, setLightboxSrc] = useState(null)

  // 自定义 renderer：改写图片 src
  const html = useMemo(() => {
    const renderer = new marked.Renderer()
    renderer.image = ({ href, title, text }) => {
      const resolved = resolveImageSrc(href, currentFilePath)
      const titleAttr = title ? ` title="${title}"` : ''
      return `<img src="${resolved}" alt="${text || ''}"${titleAttr} class="md-img" />`
    }
    try {
      return marked.parse(content || '', { renderer })
    } catch {
      return '<p style="color:#ff3b30">渲染出错</p>'
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

  // ESC 关闭 Lightbox 或退出全屏
  useEffect(() => {
    if (!lightboxSrc && !isFullscreen) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (lightboxSrc) setLightboxSrc(null)
        else if (isFullscreen) onToggleFullscreen()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxSrc, isFullscreen, onToggleFullscreen])

  return (
    <div
      className="flex flex-col overflow-hidden bg-white h-full"
      style={isFullscreen ? { width: '100%', height: '100%' } : { flex: 1 }}
    >
      {/* 预览标头 */}
      <div className="flex items-center justify-between h-8 px-4 bg-[#fafafa] border-b border-black/[0.04] text-xs text-[#86868b] shrink-0">
        <span>{isFullscreen ? '预览（全屏 · ESC 退出）' : '预览（双击图片放大）'}</span>
        <button
          onClick={onToggleFullscreen}
          className="p-1 rounded-md hover:bg-black/[0.06] text-[#86868b] hover:text-[#1d1d1f] transition-all duration-150"
          title={isFullscreen ? '退出全屏 (ESC)' : '全屏预览'}
        >
          {isFullscreen ? <Minimize2 size={13} strokeWidth={1.8} /> : <Maximize2 size={13} strokeWidth={1.8} />}
        </button>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
      >
        <div
          className="markdown-preview mx-auto"
          style={{
            fontSize: `${fontSize}px`,
            maxWidth: isFullscreen ? '780px' : 'none',
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      {/* 图片 Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-md cursor-zoom-out"
          onClick={() => setLightboxSrc(null)}
        >
          <img
            src={lightboxSrc}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white/80 hover:bg-white/30 hover:text-white text-lg transition-all duration-150"
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
