import { useState, useRef, useEffect } from 'react'
import {
  FileText, FolderOpen, ChevronDown, ChevronRight, Folder, FilePlus, Trash2
} from 'lucide-react'

function FileItem({ item, currentFilePath, onFileSelect, onDeleteFile, depth = 0 }) {
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

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (window.confirm(`确定要删除 "${item.name}" 吗？\n文件将被移动到回收站。`)) {
      onDeleteFile(item.path)
    }
  }

  return (
    <div>
      <div
        onClick={handleClick}
        className={`group flex items-center gap-1.5 px-2 py-[5px] cursor-pointer rounded-lg mx-1.5 text-[13px] transition-all duration-150
          ${isActive
            ? 'bg-[#007AFF]/10 text-[#007AFF]'
            : 'text-[#1d1d1f] hover:bg-black/[0.04]'
          }`}
        style={{ paddingLeft: `${10 + depth * 16}px` }}
      >
        {item.isDirectory ? (
          <>
            {expanded
              ? <ChevronDown size={13} strokeWidth={2} className="shrink-0 text-[#86868b]" />
              : <ChevronRight size={13} strokeWidth={2} className="shrink-0 text-[#86868b]" />
            }
            <Folder size={14} strokeWidth={1.8} className={`shrink-0 ${isActive ? 'text-[#007AFF]' : 'text-[#007AFF]/60'}`} />
          </>
        ) : (
          <>
            <span className="w-[13px] shrink-0" />
            <FileText size={14} strokeWidth={1.8} className={`shrink-0 ${isActive ? 'text-[#007AFF]' : 'text-[#86868b]'}`} />
          </>
        )}
        <span className={`truncate flex-1 ${isActive ? 'font-medium' : ''}`}>{item.name}</span>
        {/* 删除按钮 - 仅对文件显示 */}
        {!item.isDirectory && (
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-black/[0.06] text-[#86868b] hover:text-[#ff3b30] transition-all duration-150 shrink-0"
            title="删除文件"
          >
            <Trash2 size={12} strokeWidth={1.8} />
          </button>
        )}
      </div>
      {item.isDirectory && expanded && (
        <div>
          {children.map(child => (
            <FileItem
              key={child.path}
              item={child}
              currentFilePath={currentFilePath}
              onFileSelect={onFileSelect}
              onDeleteFile={onDeleteFile}
              depth={depth + 1}
            />
          ))}
          {loaded && children.length === 0 && (
            <div
              className="text-xs text-[#aeaeb2] px-2 py-1"
              style={{ paddingLeft: `${26 + (depth + 1) * 16}px` }}
            >
              空目录
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ folderTree, currentFilePath, currentFolder, onFileSelect, onOpenFolder, onCreateFile, onDeleteFile }) {
  const [isCreating, setIsCreating] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [createError, setCreateError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isCreating])

  const handleStartCreate = () => {
    if (!currentFolder) {
      onOpenFolder()
      return
    }
    setIsCreating(true)
    setNewFileName('')
    setCreateError('')
  }

  const handleCreateConfirm = async () => {
    const name = newFileName.trim()
    if (!name) {
      setIsCreating(false)
      return
    }
    const fileName = name.endsWith('.md') ? name : `${name}.md`
    const result = await onCreateFile(fileName)
    if (result && !result.success) {
      setCreateError(result.error || '创建失败')
    } else {
      setIsCreating(false)
      setNewFileName('')
      setCreateError('')
    }
  }

  const handleCreateKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCreateConfirm()
    } else if (e.key === 'Escape') {
      setIsCreating(false)
      setNewFileName('')
      setCreateError('')
    }
  }

  return (
    <div className="flex flex-col w-60 shrink-0 bg-[#f6f6f6]/80 backdrop-blur-2xl border-r border-black/[0.06] overflow-hidden">
      {/* 标头 */}
      <div className="flex items-center justify-between h-9 px-3.5 border-b border-black/[0.06] shrink-0">
        <span className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">文件</span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleStartCreate}
            className="p-1 rounded-md hover:bg-black/[0.06] text-[#86868b] hover:text-[#1d1d1f] transition-all duration-150"
            title="新建文件"
          >
            <FilePlus size={14} strokeWidth={1.8} />
          </button>
          <button
            onClick={onOpenFolder}
            className="p-1 rounded-md hover:bg-black/[0.06] text-[#86868b] hover:text-[#1d1d1f] transition-all duration-150"
            title="打开文件夹"
          >
            <FolderOpen size={14} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* 文件树 */}
      <div className="flex-1 overflow-y-auto py-1.5">
        {/* 新建文件输入框 */}
        {isCreating && (
          <div className="mx-1.5 mb-1">
            <div className="flex items-center gap-1.5 px-2 py-1">
              <FileText size={14} strokeWidth={1.8} className="shrink-0 text-[#34c759]" />
              <input
                ref={inputRef}
                type="text"
                value={newFileName}
                onChange={(e) => { setNewFileName(e.target.value); setCreateError('') }}
                onKeyDown={handleCreateKeyDown}
                onBlur={() => { if (!newFileName.trim()) { setIsCreating(false); setCreateError('') } }}
                placeholder="文件名.md"
                className="flex-1 bg-white text-[#1d1d1f] text-[13px] px-2.5 py-1 rounded-lg border border-black/[0.1] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 outline-none placeholder-[#aeaeb2] shadow-sm transition-all duration-150"
              />
            </div>
            {createError && (
              <p className="text-xs text-[#ff3b30] px-2 mt-0.5 ml-6">{createError}</p>
            )}
          </div>
        )}

        {folderTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-[#aeaeb2]">
            <FolderOpen size={32} strokeWidth={1} />
            <div className="text-center text-xs px-4">
              <p>尚未打开文件夹</p>
              <button
                onClick={onOpenFolder}
                className="mt-2 text-[#007AFF] hover:underline"
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
              onDeleteFile={onDeleteFile}
            />
          ))
        )}
      </div>
    </div>
  )
}
