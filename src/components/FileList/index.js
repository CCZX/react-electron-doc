import React, { useState, useEffect, useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons'
import { faMarkdown } from '@fortawesome/free-brands-svg-icons'
import useKeyPressed from './../../hooks/useKeyPress'
import useContextMenu from './../../hooks/useContextmenu'
import { getParentNode } from './../../utils/common'
import './index.scss'

const { remote } = window.require('electron')
const { Menu, MenuItem } = remote

function FileList({files, onFileClick, onFileDelete, onSaveEdit}) {
  const [editStatus, setEditStatus] = useState(false)
  const [value, setValue] = useState('')
  const node = useRef(null)
  const enterPressed = useKeyPressed(13)
  const escPressed = useKeyPressed(27)

  const closeSearch = useCallback((editItem) => {
    setEditStatus(false)
    setValue('')
    // if we are edit
    if (editItem.isNew) {
      onFileDelete(editItem.id)
    }
  })


  const clickedItem = useContextMenu([
    new MenuItem({
      label: '打开',
      click() {
        const parentNode = getParentNode(clickedItem.current, 'file-item')
        if (parentNode) {
          onFileClick(parentNode.dataset.id)
        }
      }
    }),
    new MenuItem({
      label: '重命名',
      click() {
        const parentNode = getParentNode(clickedItem.current, 'file-item')
        if (parentNode) {
          setEditStatus(parentNode.dataset.id)
          setValue(parentNode.dataset.title)
        }
      }
    }),
    new MenuItem({
      label: '删除',
      click() {
        const parentNode = getParentNode(clickedItem.current, 'file-item')
        if (parentNode) {
          onFileDelete(parentNode.dataset.id)
        }
      }
    })
  ], '.file-list', files)

  useEffect(() => {
    node.current && node.current.focus()
  }, [editStatus])

  useEffect(() => {
    const editItem = files.find(file => file.id === editStatus)
    if (enterPressed && editStatus && value.trim() !== '') {
      onSaveEdit(editStatus, value, editItem.isNew)
      setEditStatus(false)
      setValue('')
      // if (editItem.isNew) {
      //   onFileClick(editItem.id)
      // }
    }
    if (escPressed && editStatus) {
      closeSearch(editItem)
    }
  }, [enterPressed, editStatus, escPressed, onSaveEdit, value, files, closeSearch, onFileClick])

  useEffect(() => {
    const newFile = files.find(file => file.isNew)
    if(newFile) {
      setEditStatus(newFile.id)
      setValue(newFile.title)
    }
  }, [files])

  return (
    <ul className="list-group list-group-flush file-list">
      {
        files.map(file => {
          return <li
            className="list-group-item bg-light d-flex align-items-center row file-item mx-0"
            key={file.id}
            data-id={file.id}
            data-title={file.title}
          >
            {
              (editStatus === file.id || file.isNew) ? (
                <>
                  <input
                    className="form-control col-12"
                    value={value}
                    ref={node}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={() => closeSearch(file)}
                  />
                </>
              ) : (
                <>
                  <span className="col-2 p-0">
                    <FontAwesomeIcon size="lg" icon={faMarkdown} />
                  </span>
                  <span className="col-10 pl-2 c-link file-title"
                    onClick={() => {onFileClick(file.id)}}
                    title={file.title+'.md'}
                  >{file.title}.md</span>
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
