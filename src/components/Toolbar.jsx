import {
  FilePlus, FolderOpen, Save, PanelLeft, LayoutTemplate,
  List, Minus, Plus
} from 'lucide-react'

function ToolBtn({ icon: Icon, title, active, onClick }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors titlebar-no-drag
        ${active
          ? 'bg-[#313244] text-[#cdd6f4]'
          : 'text-[#6c7086] hover:bg-[#313244] hover:text-[#cdd6f4]'
        }`}
    >
      <Icon size={15} />
    </button>
  )
}

export default function Toolbar({
  showSidebar, showPreview, showToc,
  fontSize, isDirty,
  onToggleSidebar, onTogglePreview, onToggleToc,
  onSave, onNewFile, onOpenFile,
  onFontSizeChange,
}) {
  return (
    <div className="flex items-center gap-0.5 titlebar-no-drag">
      <ToolBtn icon={FilePlus}     title="新建文件 ⌘N"    onClick={onNewFile} />
      <ToolBtn icon={FolderOpen}   title="打开文件 ⌘O"    onClick={onOpenFile} />
      <ToolBtn
        icon={Save}
        title="保存 ⌘S"
        active={isDirty}
        onClick={onSave}
      />

      <div className="w-px h-4 bg-[#313244] mx-1" />

      <ToolBtn icon={PanelLeft}    title="切换侧边栏 ⌘B"  active={showSidebar}  onClick={onToggleSidebar} />
      <ToolBtn icon={LayoutTemplate} title="切换预览 ⌘P"  active={showPreview}  onClick={onTogglePreview} />
      <ToolBtn icon={List}         title="目录"            active={showToc}      onClick={onToggleToc} />

      <div className="w-px h-4 bg-[#313244] mx-1" />

      {/* 字号调节 */}
      <button
        onClick={() => onFontSizeChange(s => Math.max(10, s - 1))}
        title="缩小字体"
        className="p-1.5 rounded text-[#6c7086] hover:bg-[#313244] hover:text-[#cdd6f4] transition-colors"
      >
        <Minus size={14} />
      </button>
      <span className="text-xs text-[#6c7086] w-6 text-center">{fontSize}</span>
      <button
        onClick={() => onFontSizeChange(s => Math.min(24, s + 1))}
        title="放大字体"
        className="p-1.5 rounded text-[#6c7086] hover:bg-[#313244] hover:text-[#cdd6f4] transition-colors"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
