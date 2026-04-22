import { useState, useCallback } from 'react'

export function useFileSystem() {
  const [currentFolder, setCurrentFolder] = useState(null)
  const [folderTree, setFolderTree] = useState([])

  const openFolder = useCallback(async (dirPath) => {
    if (!window.electronAPI) return
    const result = await window.electronAPI.readDir(dirPath)
    if (result.success) {
      setCurrentFolder(dirPath)
      setFolderTree(result.items)
    }
  }, [])

  return {
    currentFolder,
    folderTree,
    openFolder,
  }
}
