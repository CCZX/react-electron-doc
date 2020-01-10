const { remote, ipcRenderer } = require('electron')
const Store = require('electron-store')

const settingsStore = new Store({'name': 'settings'})
const qiniuConfigArr = ['#savedFileLocaltion','#accessKey', '#secretKey', '#bucketName']

const $ = (dom) => {
  return document.querySelector(dom)
}
const $$ = (dom) => {
  return document.querySelectorAll(dom)
}

document.addEventListener('DOMContentLoaded', () => {
  qiniuConfigArr.forEach(item => {
    const savedValue = settingsStore.get(item.replace('#', '')) || ''
    if (savedValue) {
      $(item).value = savedValue
    }
  })

  $('#select-new-location').addEventListener('click', () => {
    remote.dialog.showOpenDialog({
      properties: ['openDirectory'],
      message: '选择文件的储存路劲',
    }).then(res => {
      const { canceled, filePaths } = res
      if (!canceled) {
        $('#savedFileLocaltion').value = filePaths[0]
      }
    })
  })

  $('#settings-form').addEventListener('submit', (e) => {
    e.preventDefault()
    qiniuConfigArr.forEach(_ => {
      if ($(_)) {
        const { id, value } = $(_)
        settingsStore.set(id, value ? value : '')
      }
    })
    // send event to main process to refres that emnu item of rely on qiniu cnfig
    ipcRenderer.send('config-is-saved')
    remote.getCurrentWindow().close()
  })
  $('.nav-tabs').addEventListener('click', (e) => {
    e.preventDefault()
    $$('.nav-link').forEach(el => {
      el.classList.remove('active')
    })
    e.target.classList.add('active')
    $$('.config-area').forEach(el => {
      el.style.display = 'none'
    })
    $(e.target.dataset.tab).style.display = 'block'
  })
})
