import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons'
import useKeyPress from './../../hooks/useKeyPress'
import './index.scss'
import useIpcRenderer from './../../hooks/useIpcRenderer'

function FileSearch({title, onFileSearch}) {
  const [inputActive, setInputActive] = useState(false)
  const [value, setValue] = useState('')
  const inpRef = useRef()
  const enterPressed = useKeyPress(13)
  const escPressed = useKeyPress(27)

  const closeSearch = () => {
    setInputActive(false)
    setValue('')
    onFileSearch('')
  }

  useEffect(() => {
    if (enterPressed && inputActive) {
      onFileSearch(value)
    }
    if (escPressed && inputActive) {
      closeSearch()
    }
  })
  useEffect(() => {
    inputActive && inpRef.current.focus()
  }, [inputActive])
  // useEffect(() => {
  //   const hiddenInp = () => {
  //     setInputActive(false)
  //     setValue('')
  //   }
  //   document.addEventListener('click', hiddenInp)
  //   return () => {
  //     document.removeEventListener('click', hiddenInp)
  //   }
  // })
  useIpcRenderer({
    'search-file'() {
      setInputActive(true)
    }
  })
  return (
    <div className="wrapper alert alert-primary d-flex justify-content-between align-items-center mb-0">
      {
        !inputActive ?
        <>
          <span>{title}</span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => {setInputActive(true)}}
          >
            <FontAwesomeIcon title="搜索" icon={faSearch} />
          </button>
        </> :
        <>
          <input
            className="form-control"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            ref={inpRef}
            onBlur={closeSearch}
          />
          <button
            type="button"
            className="icon-btn"
            onClick={closeSearch}
          >
            <FontAwesomeIcon title="关闭" icon={faTimes} />
          </button>
        </>
      }
    </div>
  )
}

FileSearch.propTypes = {
  title: PropTypes.string,
  onFileSearch: PropTypes.func.isRequired
}

FileSearch.defaultProps = {
  title: "我的云文档"
}

export default FileSearch
