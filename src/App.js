import React, {useState} from 'react'
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
import defaultFiles from './utils/defaultFiles'
import { flatArr, hashMapToArr } from './utils/common'
import fileHelper from './utils/fsOperation'

const { join } = window.require('path')
const { remote } = window.require('electron')

function App() {
  const [files, setFiles] = useState(flatArr(defaultFiles)) // [{}, {}]
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
    // if openedFileIDs not inclueds fileID then add new fileID to openFileIDs
    // setOpenedFileIDs(Array.from(new Set([...openedFileIDs, fileID])))
    if (!openedFileIDs.includes(fileID)) {
      setOpenedFileIDs([...openedFileIDs, fileID])
    }
  }
  // handle file list item onDelete
  const fileDelete = (fileID) => {
    delete files[fileID]
    setFiles(files)
    // close tab if opened
    tabClose(fileID)
  }
  const updateFileName = (fileID, title, isNew) => {
    const modifiedFile = {...files[fileID], title, isNew: false}
    setFiles({...files, [fileID]: modifiedFile})
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
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
