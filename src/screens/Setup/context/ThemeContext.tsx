import React, { createContext, useContext, useState, useEffect } from 'react'
import { useTheme } from 'tamagui'
import { useThemeSetting } from '../../../stores/settings/app'

interface ThemeContextType {
    isLight: boolean
    themeKey: string
}

const ThemeContext = createContext<ThemeContextType>({
    isLight: false,
    themeKey: 'dark',
})

export const useSetupTheme = () => useContext(ThemeContext)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const theme = useTheme()
    const [themeSetting] = useThemeSetting()
    const [themeKey, setThemeKey] = useState(themeSetting)
    
    // Detect if theme is light based on text color
    const textColor = theme.color.val
    const isLight = textColor === '#0C0622' || textColor.includes('12, 6, 34') || textColor.toLowerCase().includes('purple')
    
    useEffect(() => {
        // Update theme key whenever setting changes
        setThemeKey(themeSetting)
        console.log('Theme changed to:', themeSetting, 'isLight:', isLight)
    }, [themeSetting, isLight])
    
    return (
        <ThemeContext.Provider value={{ isLight, themeKey }}>
            {children}
        </ThemeContext.Provider>
    )
}


