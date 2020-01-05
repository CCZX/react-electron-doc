const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const isDev = require('electron-is-dev')
const path = require('path')
const menuTemplate = require('./src/menuTemplate')
const AppWindow = require('./src/appWindow')
const Store = require('electron-store')
const settingsStore = new Store({ name: 'Settings'})
const QiniuManager = require('./src/utils/qiniu')

const qiniuIsConfiged = ['accessKey', 'secretKey', 'bucketName'].every(key => !!settingsStore.get(key))
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
  const URLLocation = isDev ? 'http://localhost:3000' : 'dummyURL'
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

    // 在保存七牛云的配置后动态的改变菜单栏的属性
    ipcMain.on('confing-is-saved', () => {
      let qiniuMenu = process.platform === 'darwin' ? menu.items[3] : menu.items[2]
      const toggleItems = (toggle) => {
        [1, 2, 3].forEach(item => {
          qiniuMenu.submenu.items[item].enabled = toggle
        })
      }
      toggleItems(!!qiniuIsConfiged)
    })
  })

  // 
  ipcMain.on('upload-file', (e, data) => {
    const manager = createQiniuManager()
    const { key, path } = data
    manager.uploadFile(key, path).then(res => {
      console.log("success", res)
      mainWindow.webContents.send('active-file-uploaded')
    }).catch(err => {
      dialog.showErrorBox('同步失败', '请检查七牛云参数或者网络是否正确！')
    })
  })
})
