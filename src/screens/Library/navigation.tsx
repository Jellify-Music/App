import { NavigationProp } from '@react-navigation/native'
import LibraryStackParamList from './types'
import { createContext, useContext } from 'use-context-selector'
import TabParamList from '../Tabs/types'

export const LibraryNavigationContext = createContext<NavigationProp<TabParamList> | null>(null)

const useLibraryNavigation = () => {
	const context = useContext(LibraryNavigationContext)

	if (!context)
		throw new Error('useLibraryNavigation must be used in the the LibraryNavigationProvider')
	return context
}

export default useLibraryNavigation
