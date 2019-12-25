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
import { file } from '@babel/types';

function App() {
  const [files, setFiles] = useState(defaultFiles)
  const [activeFileID, setActiveFileID] = useState('')
  const [opendFileIDs, setOpendFileIDs] = useState([])
  const [unSaveFilesIDs, setUnSaveFilesIDs] =useState([])

  const opendFiles = opendFileIDs.map(openID => {
    return files.find(file => file.id === openID)
  })
  const activeFile = files.find(file => file.id === activeFileID)

  return (
    <div className="App container-fluid px-0">
      <div className="row no-gutters">
        <div className="col-3 left-panel">
          <FileSearch title="我的云文档" onFileSearch={(val) => {console.log(val)}} />
          <FileList
            files={files}
            onFileClick={(id) => {console.log(id)}}
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
                files={opendFiles}
                activeId={activeFileID}
                unSaveIds={unSaveFilesIDs}
                handleTabClick={(id) => {console.log('click', id)}}
                handleTabClose={(id) => {console.log('close', id)}}
              />
              <SimpleMDE
                value={activeFile && activeFile.body}
                onChange={val => console.log(val)}
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
