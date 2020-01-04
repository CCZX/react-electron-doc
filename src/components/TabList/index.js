import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import './index.scss'

const TabList = ({files, activeId, unSaveIds, handleTabClick, handleTabClose}) => {
  return (
    <ul className="nav nav-pills tablist-component">
      {
        files.map((file, index) => {
          const withUnsaveMark = unSaveIds.includes(file.id)
          const fclassNames = classNames({
            'nav-link': true,
            'active': file.id === activeId,
            'with-unsaved': withUnsaveMark
          })
          return(
            <li className="nav-item" key={file.id}>
              <a
                href="#"
                className={fclassNames}
                onClick={(e) => {e.preventDefault(); handleTabClick(file.id)}}
              >
                {file.title}
                <span
                  className="ml-2 close-icon"
                  onClick={(e) => {e.stopPropagation(); handleTabClose(file.id)}}
                >
                  <FontAwesomeIcon icon={faTimes}/>
                </span>
                {
                  withUnsaveMark && <span className="rounded-circle ml-2 unsaved-icon"></span>
                }
              </a>
            </li>
          )
        })
      }
    </ul>
  )
}

TabList.propTypes = {
  files: PropTypes.array,
  activeId: PropTypes.string,
  unSaveIds: PropTypes.array,
  handleTabClick: PropTypes.func,
  handleTabClose: PropTypes.func
}

TabList.defaultProps = {
  unSaveIds: []
}

export default TabList
