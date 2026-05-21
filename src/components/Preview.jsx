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

// 检测内容是否包含需要 iframe 渲染的 HTML（style/script/form 等）
function hasRichHtml(content) {
  if (!content) return false
  return /<(style|script|form|iframe|canvas|video|audio|svg)\b/i.test(content)
}

export default function Preview({ content, fontSize, currentFilePath, splitRatio, isFullscreen, onToggleFullscreen }) {
  const scrollRef = useRef(null)
  const [lightboxSrc, setLightboxSrc] = useState(null)

  // 判断是否包含富 HTML（需要 iframe 隔离渲染）
  const needsIframe = useMemo(() => hasRichHtml(content), [content])

  // 解析 Markdown → HTML
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

  // 为 iframe 模式构建完整 HTML 文档
  const iframeSrcDoc = useMemo(() => {
    if (!needsIframe) return ''
    const baseHref = currentFilePath
      ? `<base href="file://${currentFilePath.replace(/[^/]+$/, '')}">`
      : ''
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
${baseHref}
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
    font-size: ${fontSize}px;
    line-height: 1.8;
    color: #1d1d1f;
    padding: 28px 36px;
    margin: 0;
    -webkit-font-smoothing: antialiased;
  }
  img { max-width: 100%; border-radius: 10px; }
  a { color: #007AFF; text-decoration: none; }
  a:hover { text-decoration: underline; }
  code {
    font-family: 'JetBrains Mono', Menlo, monospace;
    font-size: 0.85em;
    background: #f5f5f7;
    padding: 2px 7px;
    border-radius: 5px;
  }
  pre {
    background: #f5f5f7;
    border: 1px solid rgba(0,0,0,0.04);
    border-radius: 12px;
    padding: 18px 20px;
    overflow-x: auto;
  }
  pre code { background: transparent; padding: 0; }
  blockquote {
    border-left: 3px solid #007AFF;
    padding: 10px 18px;
    margin: 1em 0;
    background: rgba(0,122,255,0.04);
    border-radius: 0 8px 8px 0;
    color: #48484a;
  }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid rgba(0,0,0,0.06); padding: 10px 14px; text-align: left; }
  th { background: #f5f5f7; font-weight: 600; }
  h1, h2, h3, h4, h5, h6 { margin-top: 1.6em; margin-bottom: 0.6em; font-weight: 600; }
  h1 { font-size: 2em; border-bottom: 1px solid rgba(0,0,0,0.06); padding-bottom: 0.3em; }
  h2 { font-size: 1.5em; border-bottom: 1px solid rgba(0,0,0,0.06); padding-bottom: 0.2em; }
  hr { border: none; border-top: 1px solid rgba(0,0,0,0.08); margin: 2em 0; }
</style>
</head>
<body>${html}</body>
</html>`
  }, [html, fontSize, currentFilePath, needsIframe])

  // 双击图片放大（仅非 iframe 模式）
  useEffect(() => {
    if (needsIframe) return
    const container = scrollRef.current
    if (!container) return
    const handler = (e) => {
      if (e.target.tagName === 'IMG' && e.target.classList.contains('md-img')) {
        setLightboxSrc(e.target.src)
      }
    }
    container.addEventListener('dblclick', handler)
    return () => container.removeEventListener('dblclick', handler)
  }, [html, needsIframe])

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
        <span>
          {isFullscreen
            ? '预览（全屏 · ESC 退出）'
            : needsIframe
              ? '预览（HTML 模式）'
              : '预览（双击图片放大）'
          }
        </span>
        <button
          onClick={onToggleFullscreen}
          className="p-1 rounded-md hover:bg-black/[0.06] text-[#86868b] hover:text-[#1d1d1f] transition-all duration-150"
          title={isFullscreen ? '退出全屏 (ESC)' : '全屏预览'}
        >
          {isFullscreen ? <Minimize2 size={13} strokeWidth={1.8} /> : <Maximize2 size={13} strokeWidth={1.8} />}
        </button>
      </div>

      {/* 当内容包含 style/script/form 等富 HTML 时，用 iframe 隔离渲染 */}
      {needsIframe ? (
        <iframe
          className="flex-1 w-full bg-white border-none"
          srcDoc={iframeSrcDoc}
          sandbox="allow-scripts"
          title="HTML Preview"
          style={{ maxWidth: isFullscreen ? '780px' : 'none', margin: isFullscreen ? '0 auto' : undefined }}
        />
      ) : (
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
      )}

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
