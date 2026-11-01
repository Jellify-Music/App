import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Search from '../../components/Search'
import SearchParamList from './types'
import { BaseStackScreens } from '../base-stack'
import { stackScreenOptions } from '../navigation'
import { holidayHeaderOptions } from '../../components/Holidays/header-options'

const SearchStack = createNativeStackNavigator<SearchParamList>({
	initialRouteName: 'SearchScreen',
	screenOptions: stackScreenOptions,
	screens: {
		SearchScreen: {
			screen: Search,
			options: () => ({
				title: 'Search',
				...holidayHeaderOptions({ icon: 'flake', snow: { count: 26, seed: 23 } }),
			}),
		},
		...BaseStackScreens,
	},
})

export default SearchStack
