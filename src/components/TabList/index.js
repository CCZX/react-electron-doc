import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'

const TabList = ({files, activeId, unSaveIds, handleTabClick, handleTabClose}) => {
  return (
    <ul className="nav nav-pills">
      {
        files.map((file, index) => {
          const fclassNames = classNames({
            'nav-link': true,
            'active': file.id === activeId
          })
          return(
            <li className="nav-item" key={file.id}>
              <a
                href="#"
                className={fclassNames}
                onClick={(e) => {e.preventDefault(); handleTabClick(file.id)}}
              >
                {file.title}
                <span className="ml-2">
                  <FontAwesomeIcon icon={faTimes}/>
                </span>
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
