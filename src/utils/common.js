export const updateArrayItemById = (arr, id, key, val) => {
  return arr.map(item => {
    if (item.id === id) {
      item[key] = val
    }
    return item
  })
}
