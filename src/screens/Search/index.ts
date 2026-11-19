import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Search from '../../components/Search'
import SearchParamList from './types'
import { BaseStack } from '../base-stack'
import { stackScreenOptions } from '../navigation'
import i18n from '../../i18n'

const SearchStack = createNativeStackNavigator<SearchParamList>({
	initialRouteName: 'SearchScreen',
	screenOptions: stackScreenOptions,
	screens: {
		SearchScreen: {
			screen: Search,
			options: {
				title: i18n.t('navigation.search'),
			},
		},
		...BaseStack,
	},
})

export default SearchStack
