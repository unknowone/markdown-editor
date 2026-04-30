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
    <div className="flex flex-col w-52 shrink-0 bg-[#fafafa] border-l border-black/[0.06] overflow-hidden">
      <div className="flex items-center h-8 px-3.5 border-b border-black/[0.04] shrink-0">
        <span className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">目录</span>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {headings.length === 0 ? (
          <p className="text-xs text-[#aeaeb2] px-3.5 py-2">无标题</p>
        ) : (
          headings.map((h, i) => (
            <div
              key={i}
              className="flex items-start px-3 py-[3px] cursor-pointer hover:bg-black/[0.04] rounded-lg mx-1.5 transition-all duration-150 group"
              style={{ paddingLeft: `${10 + (h.level - 1) * 12}px` }}
              onClick={() => {
                const el = document.getElementById(h.id)
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <span className="text-[10px] text-[#aeaeb2] mr-1.5 shrink-0 mt-[1px] group-hover:text-[#007AFF] font-medium">
                {'H' + h.level}
              </span>
              <span className="text-xs text-[#48484a] truncate group-hover:text-[#007AFF]">
                {h.text}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
