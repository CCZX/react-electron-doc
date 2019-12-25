import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons'
import { faMarkdown } from '@fortawesome/free-brands-svg-icons'
import useKeyPressed from './../../hooks/useKeyPress'

function FileList({files, onFileClick, onFileDelete, onSaveEdit}) {
  const [editStatus, setEditStatus] = useState(false)
  const [value, setValue] = useState()
  const enterPressed = useKeyPressed(13)
  const escPressed = useKeyPressed(27)

  const closeSearch = () => {
    setEditStatus(false)
    setValue()
  }

  useEffect(() => {
    if (enterPressed && editStatus) {
      onSaveEdit(editStatus, value)
    }
    if (escPressed && editStatus) {
      setEditStatus(false)
      setValue('')
    }
  }, [enterPressed, editStatus, escPressed, onSaveEdit, value])

  return (
    <ul className="list-group list-group-flush file-list">
      {
        files.map(file => {
          return <li
            key={file.id}
            className="list-group-item bg-light d-flex align-items-center row file-item mx-0"
          >
            {
              editStatus !== file.id ? (
                <>
                  <span className="col-2">
                    <FontAwesomeIcon size="lg" icon={faMarkdown} />
                  </span>
                  <span className="col-6 c-link"
                    onClick={() => {onFileClick(file.id)}}
                  >{file.title}</span>
                  <button
                    type="button"
                    className="icon-btn col-2"
                    onClick={() => {setEditStatus(file.id); setValue(file.title)}}
                  >
                    <FontAwesomeIcon title="编辑" icon={faEdit} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn col-2"
                    onClick={() => {onFileDelete(file.id)}}
                  >
                    <FontAwesomeIcon title="删除" icon={faTrash} />
                  </button>
                </>
              ) : (
                <>
                  <input
                    className="form-control col-10"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                  <button
                    type="button"
                    className="icon-btn col-2"
                    onClick={closeSearch}
                  >
                    <FontAwesomeIcon title="关闭" icon={faTimes} />
                  </button>
                </>
              )
            }
          </li>
        })
      }
    </ul>
  )
}

FileList.proTotype = {
  files: PropTypes.array,
  onFileClick: PropTypes.func,
  onFileDelete: PropTypes.func,
  onSaveEdit: PropTypes.func
}

export default FileList
