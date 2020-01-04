import { useEffect, useRef } from 'react'
const { remote } = window.require('electron')
const { Menu, MenuItem } = remote

const useContextMenu = (menuItems, showArea, deps) => {
  let clickedItem = useRef(null)
  useEffect(() => {
    const menu = new Menu()
    menuItems.forEach(item => {
      menu.append(new MenuItem(item))
    })
    const handleContextMenu = (e) => {
      if (document.querySelector(showArea).contains(e.target)) {
        clickedItem.current = e.target
        menu.popup()
      }
    }
    window.addEventListener('contextmenu', handleContextMenu)
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [deps, menuItems, showArea])
  return clickedItem
}

export default useContextMenu
