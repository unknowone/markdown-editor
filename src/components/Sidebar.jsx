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
        className={`group flex items-center gap-1.5 px-2 py-1 cursor-pointer rounded-md mx-1 text-sm transition-colors
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
        <span className="truncate flex-1">{item.name}</span>
        {/* 删除按钮 - 仅对文件显示 */}
        {!item.isDirectory && (
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#45475a] text-[#6c7086] hover:text-[#f38ba8] transition-all shrink-0"
            title="删除文件"
          >
            <Trash2 size={12} />
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
      // 如果没有打开文件夹，先让用户打开
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
    // 自动追加 .md 后缀
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
    <div className="flex flex-col w-56 shrink-0 bg-[#181825] border-r border-[#313244] overflow-hidden">
      {/* 标头 */}
      <div className="flex items-center justify-between h-8 px-3 border-b border-[#313244] shrink-0">
        <span className="text-xs font-semibold text-[#6c7086] uppercase tracking-wider">文件</span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleStartCreate}
            className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
            title="新建文件"
          >
            <FilePlus size={14} />
          </button>
          <button
            onClick={onOpenFolder}
            className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
            title="打开文件夹"
          >
            <FolderOpen size={14} />
          </button>
        </div>
      </div>

      {/* 文件树 */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* 新建文件输入框 */}
        {isCreating && (
          <div className="mx-1 mb-1">
            <div className="flex items-center gap-1.5 px-2 py-1">
              <FileText size={14} className="shrink-0 text-[#a6e3a1]" />
              <input
                ref={inputRef}
                type="text"
                value={newFileName}
                onChange={(e) => { setNewFileName(e.target.value); setCreateError('') }}
                onKeyDown={handleCreateKeyDown}
                onBlur={() => { if (!newFileName.trim()) { setIsCreating(false); setCreateError('') } }}
                placeholder="文件名.md"
                className="flex-1 bg-[#313244] text-[#cdd6f4] text-sm px-2 py-0.5 rounded border border-[#45475a] focus:border-[#89b4fa] outline-none placeholder-[#6c7086]"
              />
            </div>
            {createError && (
              <p className="text-xs text-[#f38ba8] px-2 mt-0.5 ml-6">{createError}</p>
            )}
          </div>
        )}

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
              onDeleteFile={onDeleteFile}
            />
          ))
        )}
      </div>
    </div>
  )
}
