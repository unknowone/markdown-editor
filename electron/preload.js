const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // 文件系统
  readFile: (filePath) => ipcRenderer.invoke('fs:read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('fs:write-file', filePath, content),
  readDir: (dirPath) => ipcRenderer.invoke('fs:read-dir', dirPath),

  // 对话框
  openFileDialog: () => ipcRenderer.invoke('dialog:open-file'),
  openFolderDialog: () => ipcRenderer.invoke('dialog:open-folder'),
  saveFileDialog: (defaultName) => ipcRenderer.invoke('dialog:save-file', defaultName),

  // 菜单事件监听
  onMenuEvent: (channel, callback) => {
    const validChannels = [
      'menu:new-file',
      'menu:open-file',
      'menu:open-folder',
      'menu:save',
      'menu:save-as',
      'menu:toggle-sidebar',
      'menu:toggle-preview',
      'open-file',
    ]
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, callback)
      return () => ipcRenderer.removeListener(channel, callback)
    }
  },
})
