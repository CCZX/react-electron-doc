import React, {useState} from 'react'
import { faPlus, faFileImport } from '@fortawesome/free-solid-svg-icons'
import SimpleMDE from 'react-simplemde-editor'
import './App.scss'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'easymde/dist/easymde.min.css'
import FileSearch from './components/FileSearch'
import FileList from './components/FileList'
import BottomBtn from './components/BottomBtn'
import TabList from './components/TabList'
import defaultFiles from './utils/defaultFiles'

function App() {
  const [files, setFiles] = useState(defaultFiles)
  const [activeFileID, setActiveFileID] = useState('')
  const [openedFileIDs, setOpenedFileIDs] = useState([])
  const [unSaveFilesIDs, setUnSaveFilesIDs] =useState([])

  const openedFiles = openedFileIDs.map(openID => {
    return files.find(file => file.id === openID)
  })
  const activeFile = files.find(file => file.id === activeFileID)

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
   * file change
   */
  const fileChange = (id, val) => {
    // loop files find a file that file.id equal id and update the file body
    const newFiles = files.map(file => {
      if (file.id === id) {
        file.body = val
      }
      return file
    })
    setFiles(newFiles)
    // update unSaveIDs
    if (!unSaveFilesIDs.includes(id)) {
      setUnSaveFilesIDs([...unSaveFilesIDs, id])
    }
  }

  return (
    <div className="App container-fluid px-0">
      <div className="row no-gutters">
        <div className="col-3 left-panel">
          <FileSearch title="我的云文档" onFileSearch={(val) => {console.log(val)}} />
          <FileList
            files={files}
            onFileClick={fileClick}
            onFileDelete={(id) => {console.log(id)}}
            onSaveEdit={(id, title) => {console.log(id, title)}}
          />
          <div className="row no-gutters button-group">
            <div className="col">
              <BottomBtn text="新建" colorClass="btn-primary" icon={faPlus} handleClick={() => {}} />
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
                options={{
                  minHeight: '515px'
                }}
              />
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
