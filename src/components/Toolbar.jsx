import {
  FilePlus, FolderOpen, Save, PanelLeft, LayoutTemplate,
  List, Minus, Plus
} from 'lucide-react'

function ToolBtn({ icon: Icon, title, active, onClick }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-all duration-150 titlebar-no-drag
        ${active
          ? 'bg-black/[0.07] text-[#1d1d1f]'
          : 'text-[#86868b] hover:bg-black/[0.05] hover:text-[#1d1d1f]'
        }`}
    >
      <Icon size={15} strokeWidth={1.8} />
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

      <div className="w-px h-4 bg-black/[0.08] mx-1.5" />

      <ToolBtn icon={PanelLeft}      title="切换侧边栏 ⌘B"  active={showSidebar}  onClick={onToggleSidebar} />
      <ToolBtn icon={LayoutTemplate} title="切换预览 ⌘P"     active={showPreview}  onClick={onTogglePreview} />
      <ToolBtn icon={List}           title="目录"            active={showToc}      onClick={onToggleToc} />

      <div className="w-px h-4 bg-black/[0.08] mx-1.5" />

      {/* 字号调节 */}
      <button
        onClick={() => onFontSizeChange(s => Math.max(10, s - 1))}
        title="缩小字体"
        className="p-1.5 rounded-lg text-[#86868b] hover:bg-black/[0.05] hover:text-[#1d1d1f] transition-all duration-150"
      >
        <Minus size={14} strokeWidth={1.8} />
      </button>
      <span className="text-xs text-[#86868b] w-6 text-center font-medium">{fontSize}</span>
      <button
        onClick={() => onFontSizeChange(s => Math.min(24, s + 1))}
        title="放大字体"
        className="p-1.5 rounded-lg text-[#86868b] hover:bg-black/[0.05] hover:text-[#1d1d1f] transition-all duration-150"
      >
        <Plus size={14} strokeWidth={1.8} />
      </button>
    </div>
  )
}
