import { useEffect } from 'react'
const { ipcRenderer } = window.require('electron')

const useIpcRenderer = (keyCbMap) => {
  const keys = Object.keys(keyCbMap)
  useEffect(() => {
    keys.forEach(key => {
      ipcRenderer.on(key, keyCbMap[key])
    })
    return () => {
      const keys = Object.keys(keyCbMap)
      keys.forEach(key => {
        ipcRenderer.removeListener(key, keyCbMap[key])
        // ipcRenderer.removeAllListeners()
      })
    }
  })
}

export default useIpcRenderer
