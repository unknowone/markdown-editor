import { useMemo } from 'react'

function extractHeadings(markdown) {
  const lines = markdown.split('\n')
  const headings = []
  let inCodeBlock = false

  for (const line of lines) {
    if (line.startsWith('```')) { inCodeBlock = !inCodeBlock; continue }
    if (inCodeBlock) continue

    const match = line.match(/^(#{1,6})\s+(.+)/)
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].replace(/[*_`~]/g, ''),
        id: match[2].toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
      })
    }
  }
  return headings
}

export default function TableOfContents({ content }) {
  const headings = useMemo(() => extractHeadings(content), [content])

  return (
    <div className="flex flex-col w-52 shrink-0 bg-[#181825] border-l border-[#313244] overflow-hidden">
      <div className="flex items-center h-8 px-3 border-b border-[#313244] shrink-0">
        <span className="text-xs font-semibold text-[#6c7086] uppercase tracking-wider">目录</span>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {headings.length === 0 ? (
          <p className="text-xs text-[#6c7086] px-3 py-2">无标题</p>
        ) : (
          headings.map((h, i) => (
            <div
              key={i}
              className="flex items-start px-3 py-0.5 cursor-pointer hover:bg-[#313244] rounded mx-1 transition-colors group"
              style={{ paddingLeft: `${8 + (h.level - 1) * 12}px` }}
              onClick={() => {
                // 滚动到对应标题（预览区）
                const el = document.getElementById(h.id)
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <span className="text-xs text-[#6c7086] mr-1.5 shrink-0 group-hover:text-[#89b4fa]">
                {'H' + h.level}
              </span>
              <span className="text-xs text-[#a6adc8] truncate group-hover:text-[#cdd6f4]">
                {h.text}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
