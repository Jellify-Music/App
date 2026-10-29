import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Search from '../../components/Search'
import SearchParamList from './types'
import { BaseStackScreens } from '../base-stack'
import { stackScreenOptions } from '../navigation'

const SearchStack = createNativeStackNavigator<SearchParamList>({
	initialRouteName: 'SearchScreen',
	screenOptions: stackScreenOptions,
	screens: {
		SearchScreen: {
			screen: Search,
			options: {
				title: 'Search',
			},
		},
		...BaseStackScreens,
	},
})

export default SearchStack
