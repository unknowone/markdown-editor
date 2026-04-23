const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow
// 存储启动时通过文件关联传入的路径（app ready 之前可能已触发 open-file）
let pendingOpenFilePath = null

// macOS：双击 .md 文件 / 拖拽到 Dock 图标时触发
app.on('open-file', (event, filePath) => {
  event.preventDefault()
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.focus()
    mainWindow.webContents.send('open-file', filePath)
  } else {
    pendingOpenFilePath = filePath
  }
})

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'sidebar',
    backgroundColor: '#1e1e2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  })

  mainWindow.on('closed', () => { mainWindow = null })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // 页面加载完成后，若有待打开的文件则发送给渲染层
  mainWindow.webContents.once('did-finish-load', () => {
    if (pendingOpenFilePath) {
      mainWindow.webContents.send('open-file', pendingOpenFilePath)
      pendingOpenFilePath = null
    }
  })
}

// ── 菜单 ──────────────────────────────────────────────────────────────────────
function buildMenu() {
  const template = [
    {
      label: app.name,
      submenu: [
        { role: 'about', label: '关于 Markdown Editor' },
        { type: 'separator' },
        { role: 'hide', label: '隐藏' },
        { role: 'hideOthers', label: '隐藏其他' },
        { role: 'unhide', label: '全部显示' },
        { type: 'separator' },
        { role: 'quit', label: '退出' },
      ],
    },
    {
      label: '文件',
      submenu: [
        {
          label: '新建文件',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('menu:new-file'),
        },
        {
          label: '打开文件…',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow.webContents.send('menu:open-file'),
        },
        {
          label: '打开文件夹…',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => mainWindow.webContents.send('menu:open-folder'),
        },
        { type: 'separator' },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('menu:save'),
        },
        {
          label: '另存为…',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow.webContents.send('menu:save-as'),
        },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' },
      ],
    },
    {
      label: '视图',
      submenu: [
        {
          label: '切换侧边栏',
          accelerator: 'CmdOrCtrl+B',
          click: () => mainWindow.webContents.send('menu:toggle-sidebar'),
        },
        {
          label: '切换预览',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow.webContents.send('menu:toggle-preview'),
        },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' },
      ],
    },
    {
      label: '窗口',
      submenu: [
        { role: 'minimize', label: '最小化' },
        { role: 'zoom', label: '缩放' },
        { role: 'front', label: '置前' },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ── IPC 处理 ──────────────────────────────────────────────────────────────────

// 读取文件
ipcMain.handle('fs:read-file', async (_e, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return { success: true, content }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// 写入文件
ipcMain.handle('fs:write-file', async (_e, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8')
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// 读取目录
ipcMain.handle('fs:read-dir', async (_e, dirPath) => {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    const items = entries
      .filter(e => e.isDirectory() || e.name.endsWith('.md'))
      .map(e => ({
        name: e.name,
        path: path.join(dirPath, e.name),
        isDirectory: e.isDirectory(),
      }))
      .sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
        return a.name.localeCompare(b.name)
      })
    return { success: true, items }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// 打开文件对话框
ipcMain.handle('dialog:open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }],
  })
  if (result.canceled) return { canceled: true }
  return { canceled: false, filePath: result.filePaths[0] }
})

// 打开文件夹对话框
ipcMain.handle('dialog:open-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  })
  if (result.canceled) return { canceled: true }
  return { canceled: false, dirPath: result.filePaths[0] }
})

// 另存为对话框
ipcMain.handle('dialog:save-file', async (_e, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'untitled.md',
    filters: [{ name: 'Markdown', extensions: ['md'] }],
  })
  if (result.canceled) return { canceled: true }
  return { canceled: false, filePath: result.filePath }
})

// 保存图片到磁盘。currentFilePath 存在时保存到同级 assets/ 目录；否则存到 userData/images
ipcMain.handle('image:save', async (_e, { buffer, ext, currentFilePath }) => {
  try {
    let targetDir
    let relBase
    if (currentFilePath) {
      targetDir = path.join(path.dirname(currentFilePath), 'assets')
      relBase = 'assets'
    } else {
      targetDir = path.join(app.getPath('userData'), 'images')
      relBase = targetDir
    }
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true })

    const fileName = `image-${Date.now()}.${ext || 'png'}`
    const absPath = path.join(targetDir, fileName)
    fs.writeFileSync(absPath, Buffer.from(buffer))

    // 当有文档路径时返回相对路径（更便携），否则返回绝对路径
    const relativePath = currentFilePath
      ? `${relBase}/${fileName}`
      : absPath
    return { success: true, absPath, relativePath }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// ── 应用生命周期 ──────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  buildMenu()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
