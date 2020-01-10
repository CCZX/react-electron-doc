import React, { useState } from 'react'
import { faPlus, faFileImport } from '@fortawesome/free-solid-svg-icons'
import SimpleMDE from 'react-simplemde-editor'
import uuidv4 from 'uuid/v4'
import './App.scss'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'easymde/dist/easymde.min.css'
import FileSearch from './components/FileSearch'
import FileList from './components/FileList'
import BottomBtn from './components/BottomBtn'
import TabList from './components/TabList'
import { hashMapToArr, flatArr, timestampToString } from './utils/common'
import fileHelper from './utils/fsOperation'
import useIpcRenderer from './hooks/useIpcRenderer'

const { join, basename, extname, dirname } = window.require('path')
const { remote, ipcRenderer } = window.require('electron')
const Store = window.require('electron-store')
const fileStore = new Store({'name': 'Files Data'})
const settingsStore = new Store({'name': 'Settings'})
const getAutoSync = () => ['accessKey', 'secretKey', 'bucketName', 'enableAutoSync'].every(key => !!settingsStore.get(key))
const saveFilesToStore = (files) => {
  // we don't have to store any info in file system, eg: isNew, body ,etc
  const filesStoreObj = hashMapToArr(files).reduce((result, file) => {
    const { id, path, title, createdAt, isSynced, updatedAt, isNew, lastModify, isSaved } = file
    result[id] = { id, path, title, createdAt, isSynced, updatedAt, isNew, lastModify, isSaved }
    return result
  }, {})
  fileStore.set('files', filesStoreObj)
}
function App() {
  const [files, setFiles] = useState(fileStore.get('files') || {}) // {1:{}, 2:{}}
  const [activeFileID, setActiveFileID] = useState('')
  const [openedFileIDs, setOpenedFileIDs] = useState([])
  const [unSaveFilesIDs, setUnSaveFilesIDs] =useState([])
  const [searchedFiles, setSearchedFiles] = useState([]) // represent searched files to avoid conflict whit global files
  const filesArr = hashMapToArr(files)
  const savedLocation = settingsStore.get('savedFileLocaltion') || remote.app.getPath('documents')
  /**
   * 根据state的值生成相应file
   */
  const openedFiles = openedFileIDs.map(openID => {
    return files[openID]
  })
  const activeFile = files[activeFileID]

  /**
   * tab list handle function
   */
  // handle tab list item onclick
  const tabClick = (fileID) => {
    setActiveFileID(fileID)
  }
  // handle tab list item close
  const tabClose = (fileID) => {
    const id = fileID
    const { dialog } = remote
    const deleteFn = () => {
      const closeFile = {...files[id], isLoaded: false}
      setFiles({...files, [id]: closeFile})
      const newUnsavedIds = unSaveFilesIDs.filter(id => fileID !== id)
      setUnSaveFilesIDs(newUnsavedIds)
      const newopenedFileIDs = openedFileIDs.filter(id => fileID !== id)
      setOpenedFileIDs(newopenedFileIDs)
      if (activeFileID === fileID) {
        if (newopenedFileIDs.length > 0) {
          setActiveFileID(newopenedFileIDs[0])
        } else {
          setActiveFileID('')
        }
      }
    }
    if (!files[id].isSaved) {
      dialog.showMessageBox({
        type: 'info',
        title: 'Tips',
        message: `${files[id].title}.md文件还未保存确认删除？`,
        buttons: ['ok', 'no'],
        defaultId: 1,
        cancelId: 1
      }).then(res => {
        if (res.response === 0) {
          deleteFn()
        }
      })
    } else {
      deleteFn()
    }
  }

  /**
   * file list handle function
   */
  // handle flie list item onclick
  const fileClick = (fileID) => {
    // set currentActivefiel
    setActiveFileID(fileID)
    const curFile = files[fileID]
    const { id, title, path, isLoaded } = curFile
    if (!isLoaded) {
      if (getAutoSync()) {
        console.log(getAutoSync())
        ipcRenderer.send('download-file', { key: `${title}.md`, path, id })
      } else {
        console.log(curFile.path)
        fileHelper.readFile(curFile.path).then(res => {
          const newFile = {...files[fileID], body: res, isLoaded: true}
          const temp = JSON.parse(JSON.stringify(files))
          setFiles({...temp, [fileID]: newFile})
        })
      }
    }
    // if openedFileIDs not inclueds fileID then add new fileID to openFileIDs
    if (!openedFileIDs.includes(fileID)) {
      setOpenedFileIDs([...openedFileIDs, fileID])
    }
  }
  // handle file list item onDelete
  const fileDelete = (fileID) => {
    const id = fileID
    if (files[fileID].isNew) {
      const {[fileID]: value, ...newFiles} = files
      setFiles(newFiles)
    } else {
      const isDel = window.confirm(`确认删除 ${files[id].title}.md 文件？`)
      isDel && fileHelper.deleteFile(files[fileID].path).then(() => {
        const {[fileID]: value, ...newFiles} = files
        setFiles(newFiles)
        saveFilesToStore(newFiles)
        // close tab if opened
        tabClose(fileID)
      })
    }
  }
  const updateFileName = (fileID, title, isNew) => {
    // 判断是否是新建文件，如果是新建文件就保存在设置的保存文件的文件夹里面，否则就在该文件原来的基础上修改
    const newPath = isNew ? join(savedLocation, `${title}.md`) : join(dirname(files[fileID].path), `${title}.md`)
    // 修改文件的信息
    const modifiedFile = {...files[fileID], title, isNew: false, path: newPath, lastModify: Date.now()}
    const newFiles = {...files, [fileID]: modifiedFile}
    if (isNew) {
      fileHelper.writeFile(newPath, files[fileID].body).then(res => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
        setActiveFileID(fileID)
      })
    } else {
      const oldPath = files[fileID].path
      fileHelper.renameFile(oldPath, newPath).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    }
  }
  const fileSearch = (keyword) => {
    const newFiles = filesArr.filter(file => file.title.includes(keyword))
    setSearchedFiles(newFiles)
  }

  /**
   * file change
   */
  const fileChange = (id, val) => {
    if (val === files[id].body) {
      return
    }
    // loop files find a file that file.id equal id and update the file body
    const newFile = {...files[id], body: val, lastModify: Date.now(), isSynced: false, isSaved: false}
    setFiles({...files, [id]: newFile})
    // update unSaveIDs
    if (!unSaveFilesIDs.includes(id)) {
      setUnSaveFilesIDs([...unSaveFilesIDs, id])
    }
  }

  // 这并不是真正意义上的新建文件，这一步只是把新的文件放入State之中，
  // 在输入文件名点击保存（即调用了updateFileName方法）之后才会创建真正的新文件
  const createNewFile = () => {
    const newID = uuidv4()
    const newFile =  {
      id: newID,
      title: '',
      body: '## 请输入MarkDown格式文件',
      createdAt: Date.now(),
      isNew: true,
      isSynced: false,
      updatedAt: Date.now(),
      lastModify: Date.now(),
      isSaved: false
    }
    setFiles({...files, [newID]: newFile})
    // setActiveFileID(newID)
  }

  const saveCurrentFile = () => {
    const { path, body, title } = activeFile
    fileHelper.writeFile(activeFile.path, activeFile.body).then(() => {
      setUnSaveFilesIDs(unSaveFilesIDs.filter(id => id !== activeFile.id))
      console.log(getAutoSync())
      if (getAutoSync()) {
        ipcRenderer.send('upload-file', {key: `${title}.md`, path})
      }
    })
  }

  // 导入文件
  const importFiles = () => {
    const { dialog } = remote
    dialog.showOpenDialog({
      title: '选择导入的markdown文件',
      filters: [
        {name: 'Markdown files', extensions: ['md']}
      ],
      properties: ['openFile', 'multiSelections']
    }).then(res => {
      const { canceled, filePaths } = res
      if (!canceled) {
        // ['/path/234.md', '/path/123.md']
        const noAddedPaths = filePaths.filter(path => {
          const isAdded = Object.values(files).find(file => {
            return path === file.path
          })
          return !isAdded
        })
        const importFilesArr = noAddedPaths.map(path => {
          return {
            id: uuidv4(),
            title: basename(path, extname(path)),
            path,
            isNew: false,
            isSynced: false,
            updatedAt: Date.now(),
            lastModify: Date.now(),
            isSaved: true
          }
        })
        // const newFiles = {...files, ...flatArr(importFilesArr)}
        const temp = JSON.parse(JSON.stringify(files))
        // const newFiles = Object.assign(files, flatArr(importFilesArr))
        const newFiles = {...temp, ...flatArr(importFilesArr)}
        console.log(newFiles)
        setFiles(newFiles)
        saveFilesToStore(newFiles)
        console.log(files)
        if (importFilesArr.length > 0) {
          dialog.showMessageBox({
            type: 'info',
            title: `导入文件成功`,
            message: `成功导入${importFilesArr.length}了个文件`
          })
        }
      }
    })
  }

  // 上传文件到七牛云之后更新文件状态
  const activeFileUploaded = () => {
    const modifiedFile = {...files[activeFileID], isSynced: true, updatedAt: Date.now()}
    const newFiles = {...files, [activeFileID]: modifiedFile}
    setFiles(newFiles)
    saveFilesToStore(newFiles)
  }

  // 从云空间同步后的操作，同步新内容或者没有新内容
  const activeFileDownloaded = (event, msg) => {
    const { status } = msg
    const currentFile = files[msg.id]
    const { id, path } = currentFile
    fileHelper.readFile(path).then(val => {
      let newFile
      if (status === 'success') {
        newFile = { ...files[id], body: val, isLoaded: true, isSynced: true, updatedAt: Date.now() }
      } else {
        newFile = { ...files[id], body: val, isLoaded: true}
      }
      const temp = JSON.parse(JSON.stringify(files))
      const newFiles = {...temp, [id]: newFile}
      setFiles(newFiles)
      saveFilesToStore(newFiles)
    })
  }

  useIpcRenderer({
    'create-new-file': createNewFile,
    'import-file': importFiles,
    'save-edit-file': saveCurrentFile,
    'active-file-uploaded': activeFileUploaded,
    'file-downloaded': activeFileDownloaded
  })

  return (
    <div className="App container-fluid px-0">
      <div className="row no-gutters">
        <div className="col-3 left-panel">
          <FileSearch title="我的云文档" onFileSearch={fileSearch} />
          <FileList
            // files={files}
            files={searchedFiles.length > 0 ? searchedFiles : filesArr}
            onFileClick={fileClick}
            onFileDelete={fileDelete}
            onSaveEdit={updateFileName}
          />
          <div className="row no-gutters button-group">
            <div className="col">
              <BottomBtn text="新建" colorClass="btn-primary" icon={faPlus} handleClick={createNewFile} />
            </div>
            <div className="col">
              <BottomBtn text="导入" colorClass="btn-success" icon={faFileImport} handleClick={importFiles} />
            </div>
          </div>
        </div>
        <div className="col-9 right-panel">
          {
            !activeFile ? <div className="start-page">
              选择或者创建新的文章
            </div> : <>
              <TabList
                files={openedFiles}
                activeId={activeFileID}
                unSaveIds={unSaveFilesIDs}
                handleTabClick={tabClick}
                handleTabClose={tabClose}
              />
              <SimpleMDE
                key={activeFile && activeFile.id}
                value={activeFile && activeFile.body}
                onChange={val => fileChange(activeFile.id, val)}
              />
              { activeFile.updatedAt ? 
                <span>
                  <span className="sync-status">
                    { activeFile.isSynced ? '已同步' : '未同步' }，上次同步时间：{timestampToString(activeFile.updatedAt)}
                  </span>
                </span> : <span>从未同步</span>
              }
              <span className="modify-status">上次修改时间：{timestampToString(activeFile.lastModify)}</span>
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
