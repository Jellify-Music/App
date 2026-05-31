import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Search from '../../components/Search'
import SearchParamList from './types'
import { BaseStack } from '../base-stack'

const SearchStack = createNativeStackNavigator<SearchParamList>({
	initialRouteName: 'SearchScreen',
	screenOptions: {
		headerTitleAlign: 'center',
		headerTitleStyle: {
			fontFamily: 'Figtree-Bold',
		},
	},
	screens: {
		SearchScreen: {
			screen: Search,
			options: {
				title: 'Search',
			},
		},
		...BaseStack,
	},
})

export default SearchStack
