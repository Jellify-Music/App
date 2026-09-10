import { createContext, useContext, useState } from 'react'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { getTokens, getTokenValue } from 'tamagui'

interface DisplayContext {
	numberOfColumns: number
	horizontalItems: number

	display: 'grid' | 'list'

	setDisplay: React.Dispatch<React.SetStateAction<'grid' | 'list'>>
}

const DisplayContextInitializer = () => {
	const { width } = useSafeAreaFrame()

	const [numberOfColumns, setNumberOfColumns] = useState<number>(
		Math.floor(width / getTokenValue('$size.12') + getTokenValue('$space.1')),
	)

	const [display, setDisplay] = useState<'grid' | 'list'>('grid')

	const [horizontalItems, setHorizontalItems] = useState<number>(width > 800 ? 30 : 15)

	return {
		numberOfColumns,
		horizontalItems,
		display,
		setDisplay,
	}
}

const DisplayContext = createContext<DisplayContext>({
	numberOfColumns: 0,
	horizontalItems: 0,
	display: 'grid',
	setDisplay: () => {},
})

export const DisplayProvider = ({ children }: { children: React.ReactNode }) => {
	const context = DisplayContextInitializer()

	return <DisplayContext.Provider value={context}>{children}</DisplayContext.Provider>
}

export const useDisplayContext = () => useContext(DisplayContext)
