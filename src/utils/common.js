/**
 * 
 * @param {Array} arr 
 * @param {String} id 
 * @param {Object} updateObj 
 */
export const updateArrayItemById = (arr, id, updateObj) => {
  return arr.map(item => {
    if (item.id === id) {
      for (const key in updateObj) {
        if (updateObj.hasOwnProperty(key)) {
          item[key] = updateObj[key]
        }
      }
    }
    return item
  })
}

/**
 * 
 * @param {Array} arr 
 */
export const flatArr = (arr) => {
  return arr.reduce((hashMap, item) => {
    hashMap[item.id] = item
    return hashMap
  }, {})
}

/**
 * 
 * @param {Object} hashMap 
 */
export const hashMapToArr = (hashMap) => {
  const keys = Object.keys(hashMap)
  return keys.map(key => hashMap[key])
}

/**
 * 
 * @param {Element} node 
 * @param {String} parentClassName 
 */
export const getParentNode = (node, parentClassName) => {
  let cur = node
  while (cur !== null) {
    if(cur.classList.contains(parentClassName)) {
      return cur
    }
    cur = cur.parentNode
  }
  return false
}

export const timestampToString = (time) => {
  const date = new Date(time)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}
