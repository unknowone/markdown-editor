import { useState } from 'react'
import {
  FileText, FolderOpen, ChevronDown, ChevronRight, Folder
} from 'lucide-react'

function FileItem({ item, currentFilePath, onFileSelect, depth = 0 }) {
  const [expanded, setExpanded] = useState(false)
  const [children, setChildren] = useState([])
  const [loaded, setLoaded] = useState(false)

  const isActive = item.path === currentFilePath

  const handleClick = async () => {
    if (item.isDirectory) {
      if (!loaded) {
        if (window.electronAPI) {
          const result = await window.electronAPI.readDir(item.path)
          if (result.success) setChildren(result.items)
        }
        setLoaded(true)
      }
      setExpanded(v => !v)
    } else {
      onFileSelect(item.path)
    }
  }

  return (
    <div>
      <div
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-2 py-1 cursor-pointer rounded-md mx-1 text-sm transition-colors
          ${isActive
            ? 'bg-[#313244] text-[#cdd6f4]'
            : 'text-[#a6adc8] hover:bg-[#313244] hover:text-[#cdd6f4]'
          }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {item.isDirectory ? (
          <>
            {expanded
              ? <ChevronDown size={13} className="shrink-0 text-[#6c7086]" />
              : <ChevronRight size={13} className="shrink-0 text-[#6c7086]" />
            }
            <Folder size={14} className="shrink-0 text-[#89b4fa]" />
          </>
        ) : (
          <>
            <span className="w-[13px] shrink-0" />
            <FileText size={14} className="shrink-0 text-[#a6adc8]" />
          </>
        )}
        <span className="truncate">{item.name}</span>
      </div>
      {item.isDirectory && expanded && (
        <div>
          {children.map(child => (
            <FileItem
              key={child.path}
              item={child}
              currentFilePath={currentFilePath}
              onFileSelect={onFileSelect}
              depth={depth + 1}
            />
          ))}
          {loaded && children.length === 0 && (
            <div
              className="text-xs text-[#6c7086] px-2 py-1"
              style={{ paddingLeft: `${24 + (depth + 1) * 16}px` }}
            >
              空目录
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ folderTree, currentFilePath, onFileSelect, onOpenFolder }) {
  return (
    <div className="flex flex-col w-56 shrink-0 bg-[#181825] border-r border-[#313244] overflow-hidden">
      {/* 标头 */}
      <div className="flex items-center justify-between h-8 px-3 border-b border-[#313244] shrink-0">
        <span className="text-xs font-semibold text-[#6c7086] uppercase tracking-wider">文件</span>
        <button
          onClick={onOpenFolder}
          className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
          title="打开文件夹"
        >
          <FolderOpen size={14} />
        </button>
      </div>

      {/* 文件树 */}
      <div className="flex-1 overflow-y-auto py-1">
        {folderTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-[#6c7086]">
            <FolderOpen size={32} strokeWidth={1} />
            <div className="text-center text-xs px-4">
              <p>尚未打开文件夹</p>
              <button
                onClick={onOpenFolder}
                className="mt-2 text-[#89b4fa] hover:underline"
              >
                打开文件夹
              </button>
            </div>
          </div>
        ) : (
          folderTree.map(item => (
            <FileItem
              key={item.path}
              item={item}
              currentFilePath={currentFilePath}
              onFileSelect={onFileSelect}
            />
          ))
        )}
      </div>
    </div>
  )
}
