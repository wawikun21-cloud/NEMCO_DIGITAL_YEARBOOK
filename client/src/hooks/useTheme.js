import { useState, useEffect, useCallback } from 'react'

let currentTheme = localStorage.getItem('theme') || 'light'
const listeners = new Set()

function notify() {
  listeners.forEach((fn) => fn(currentTheme))
}

export function useTheme() {
  const [theme, setTheme] = useState(currentTheme)

  useEffect(() => {
    listeners.add(setTheme)
    return () => { listeners.delete(setTheme) }
  }, [])

  const toggleTheme = useCallback(() => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light'
    localStorage.setItem('theme', currentTheme)
    document.documentElement.classList.toggle('dark', currentTheme === 'dark')
    notify()
  }, [])

  return { theme, toggleTheme }
}
