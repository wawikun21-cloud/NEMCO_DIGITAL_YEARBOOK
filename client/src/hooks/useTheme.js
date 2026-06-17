import { useState, useEffect } from 'react'

export function useTheme() {
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || 'light')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return { theme, toggleTheme }
}