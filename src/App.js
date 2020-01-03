import React, {useState} from 'react'
import { faPlus, faFileImport, faSave } from '@fortawesome/free-solid-svg-icons'
import SimpleMDE from 'react-simplemde-editor'
import uuidv4 from 'uuid/v4'
import './App.scss'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'easymde/dist/easymde.min.css'
import FileSearch from './components/FileSearch'
import FileList from './components/FileList'
import BottomBtn from './components/BottomBtn'
import TabList from './components/TabList'
import { hashMapToArr } from './utils/common'
import fileHelper from './utils/fsOperation'

const { join } = window.require('path')
const { remote } = window.require('electron')
const Store = window.require('electron-store')
const fileStore = new Store({'name': 'Files Data'})
const settingsStore = new Store({name: 'Settings'})
const getAutoSync = () => ['accessKey', 'secretKey', 'bucketName', 'enableAutoSync'].every(key => !!settingsStore.get(key))
const saveFilesToStore = (files) => {
  // we don't have to store any info in file system, eg: isNew, body ,etc
  const filesStoreObj = hashMapToArr(files).reduce((result, file) => {
    const { id, path, title, createdAt, isSynced, updatedAt } = file
    result[id] = { id, path, title, createdAt, isSynced, updatedAt }
    return result
  }, {})
  fileStore.set('files', filesStoreObj)
}
console.log(fileStore.path)
function App() {
  const [files, setFiles] = useState(fileStore.get('files') || {}) // [{}, {}]
  const [activeFileID, setActiveFileID] = useState('')
  const [openedFileIDs, setOpenedFileIDs] = useState([])
  const [unSaveFilesIDs, setUnSaveFilesIDs] =useState([])
  const [searchedFiles, setSearchedFiles] = useState([]) // represent searched files to avoid conflict whit global files
  const filesArr = hashMapToArr(files)
  const savedLocation = remote.app.getPath('documents')

  /**
   * tab list handle function
   */
  // handle tab list item onclick
  const tabClick = (fileID) => {
    setActiveFileID(fileID)
  }
  // handle tab list item close
  const tabClose = (fileID) => {
    // remove current fileid from openedfiledids
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

  /**
   * file list handle function
   */
  // handle flie list item onclick
  const fileClick = (fileID) => {
    // set currentActivefiel
    setActiveFileID(fileID)
    const curFile = files[fileID]
    if (!curFile.isLoaded) {
      fileHelper.readFile(curFile.path).then(res => {
        const newFile = {...files[fileID], body: res, isLoaded: true}
        setFiles({...files, [fileID]: newFile})
      })
    }
    // if openedFileIDs not inclueds fileID then add new fileID to openFileIDs
    if (!openedFileIDs.includes(fileID)) {
      setOpenedFileIDs([...openedFileIDs, fileID])
    }
  }
  // handle file list item onDelete
  const fileDelete = (fileID) => {
    if (files[fileID].isNew) {
      const {[fileID]: value, ...newFiles} = files
      setFiles(newFiles)
    } else {
      fileHelper.deleteFile(files[fileID].path).then(() => {
        const {[fileID]: value, ...newFiles} = files
        setFiles(newFiles)
        saveFilesToStore(files)
        // close tab if opened
        tabClose(fileID)
      })
    }
  }
  const updateFileName = (fileID, title, isNew) => {
    const newPath = join(savedLocation, `${title}.md`)
    const modifiedFile = {...files[fileID], title, isNew: false, path: newPath}
    const newFiles = {...files, [fileID]: modifiedFile}
    if (isNew) {
      fileHelper.writeFile(newPath, files[fileID].body).then(res => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
        setActiveFileID(fileID)
      })
    } else {
      const oldPath = join(savedLocation, `${files[fileID].title}.md`)
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
    // loop files find a file that file.id equal id and update the file body
    const newFile = {...files[id], body: val}
    setFiles({...files, [id]: newFile})
    // update unSaveIDs
    if (!unSaveFilesIDs.includes(id)) {
      setUnSaveFilesIDs([...unSaveFilesIDs, id])
    }
  }

  const createNewFile = () => {
    const newID = uuidv4()
    const newFile =  {
      id: newID,
      title: '',
      body: '## 请输入MarkDown格式文件',
      createAt: new Date().getTime(),
      isNew: true
    }
    setFiles({...files, [newID]: newFile})
    // setActiveFileID(newID)
  }

  const saveCurrentFile = () => {
    fileHelper.writeFile(join(savedLocation, `${activeFile.title}.md`), activeFile.body).then(() => {
      setUnSaveFilesIDs(unSaveFilesIDs.filter(id => id !== activeFile.id))
    })
  }

  /**
   * 根据state的值生成相应file
   */
  const openedFiles = openedFileIDs.map(openID => {
    return files[openID]
  })
  const activeFile = files[activeFileID]

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
              <BottomBtn text="导入" colorClass="btn-success" icon={faFileImport} handleClick={() => {}} />
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
              <BottomBtn text="导入" colorClass="btn-success" icon={faSave} handleClick={saveCurrentFile} />
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
