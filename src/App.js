import React from 'react';
import './App.scss';
import 'bootstrap/dist/css/bootstrap.min.css'
import FileSearch from './components/FileSearch'
import FileList from './components/FileList'
import BottomBtn from './components/BottomBtn'
import { faPlus, faFileImport } from '@fortawesome/free-solid-svg-icons'
import TabList from './components/TabList'
import defaultFiles from './utils/defaultFiles'

function App() {
  return (
    <div className="App container-fluid px-0">
      <div className="row no-gutters">
        <div className="col-3 left-panel">
          <FileSearch title="我的云文档" onFileSearch={(val) => {console.log(val)}} />
          <FileList
            files={defaultFiles}
            onFileClick={(id) => {console.log(id)}}
            onFileDelete={(id) => {console.log(id)}}
            onSaveEdit={(id, title) => {console.log(id, title)}}
          />
          <div className="row no-gutters">
            <div className="col">
              <BottomBtn text="新建" colorClass="btn-primary" icon={faPlus} handleClick={() => {}} />
            </div>
            <div className="col">
              <BottomBtn text="导入" colorClass="btn-success" icon={faFileImport} handleClick={() => {}} />
            </div>
          </div>
        </div>
        <div className="col-9 right-panel">
          <TabList
            files={defaultFiles}
            activeId="1"
            unSaveIds={['1', '3']}
            handleTabClick={(id) => {console.log('click', id)}}
            handleTabClose={(id) => {console.log('close', id)}}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
