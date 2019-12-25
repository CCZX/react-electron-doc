import React from 'react'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const BottomBtn = ({text, colorClass, icon, handleClick}) => (
  <button
    type="button"
    className={`btn btn-block no-border ${colorClass}`}
    onClick={() => {handleClick()}}
  >
    <FontAwesomeIcon
      className="mr-2"
      title={text}
      size="lg"
      icon={icon}
    />
    {text}
  </button>
)

BottomBtn.propTypes = {
  text: PropTypes.string,
  colorClass: PropTypes.string,
  icon: PropTypes.object.isRequired,
  handleClick: PropTypes.func
}

export default BottomBtn
