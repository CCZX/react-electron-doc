const { app, Menu, ipcMain, dialog } = require('electron')
const isDev = require('electron-is-dev')
const path = require('path')
const menuTemplate = require('./src/menuTemplate')
const AppWindow = require('./src/appWindow')
const Store = require('electron-store')
const settingsStore = new Store({ name: 'Settings'})
const fileStore = new Store({'name': 'Files Data'})
const QiniuManager = require('./src/utils/qiniu')

const qiniuIsConfiged = () => ['accessKey', 'secretKey', 'bucketName'].every(key => !!settingsStore.get(key))
const createQiniuManager = () => {
  const accessKey = settingsStore.get('accessKey')
  const secretKey = settingsStore.get('secretKey')
  const bucket = settingsStore.get('bucketName')
  return new QiniuManager(accessKey, secretKey, bucket)
}

let mainWindow, settingsWindow

app.on('ready', () => {
  require('devtron').install()
  const mainWindowConfig = {
    width: 1024,
    height: 680,
  }
  const proURL = `file://${path.join(__dirname, './build/index.html')}`
  const URLLocation = isDev ? 'http://localhost:3000' : proURL
  mainWindow = new AppWindow(mainWindowConfig, URLLocation)
  mainWindow.on('closed', () => {
    mainWindow = null
  })
  mainWindow.webContents.openDevTools()
  let menu = new Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)

  // 打开设置菜单
  ipcMain.on('open-settings-window', () => {
    const settingsWindowConfig = {
      width: 500,
      height: 400,
      parent: mainWindow  
    }
    const settingsFileLocation = `file://${path.join(__dirname, './settings/index.html')}`
    settingsWindow = new AppWindow(settingsWindowConfig, settingsFileLocation)
    settingsWindow.webContents.openDevTools()
    settingsWindow.removeMenu()
    settingsWindow.on('closed', () => {
      settingsWindow = null
    })
  })

  // 在保存七牛云的配置后动态的改变菜单栏的属性
  ipcMain.on('config-is-saved', () => {
    const enableAutoSync = settingsStore.get('enableAutoSync')
    const flag = !enableAutoSync
    settingsStore.set('enableAutoSync', flag)
    let qiniuMenu = process.platform === 'darwin' ? menu.items[3] : menu.items[2]
    const toggleItems = (toggle) => {
      [1, 2, 3].forEach(item => {
        qiniuMenu.submenu.items[item].enabled = toggle
      })
    }
    toggleItems(!!qiniuIsConfiged())
  })

  // 上传文件到云空间
  ipcMain.on('upload-file', (e, data) => {
    const manager = createQiniuManager()
    const { key, path } = data
    manager.uploadFile(key, path).then(res => {
      mainWindow.webContents.send('active-file-uploaded')
    }).catch(err => {
      dialog.showErrorBox('同步失败', '请检查七牛云参数或者网络是否正确！')
    })
  })

  // 从云空间下载文件
  ipcMain.on('download-file', (e, data) => {
    const manager = createQiniuManager()
    const files = fileStore.get('files')
    const { id, key, path } = data
    manager.getState(data.key).then(res => {
      const { putTime } = res
      const serverUpTime = Math.round(putTime / 10000)
      const localUpTime = files[id].updatedAt
      if (serverUpTime > localUpTime || !localUpTime) {
        manager.downLoadFile(key, path).then(() => {
          mainWindow.webContents.send('file-downloaded', {status: 'success', id})
        })
      } else {
        mainWindow.webContents.send('file-downloaded', {status: 'no new file', id})
      }
    }, err => {
      if (err.status === 612) {
        mainWindow.webContents.send('file-downloaded', {status: 'no such file', id})
      }
    })
  })

  ipcMain.on('upload-all-to-qiniu', () => {
    mainWindow.webContents.send('loading-status', true)
    const manager = createQiniuManager()
    const files = fileStore.get('files') || {}
    const uploadPromiseArr = Object.keys(files).map(key => {
      const file = files[key]
      return manager.uploadFile(`${file.title}.md`, file.path)
    })
    Promise.all(uploadPromiseArr).then(res => {
      dialog.showMessageBox({
        type: 'info',
        message: `成功上传了${res.length}个文件`
      })
      mainWindow.webContents.send('files-uploaded')
    }).catch(err => {
      dialog.showErrorBox({
        message: '同步失败'
      })
    }).finally(() => {
      mainWindow.webContents.send('loading-status', false)
    })
  })

})
