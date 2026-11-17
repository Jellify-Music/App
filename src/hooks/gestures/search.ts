import { RefObject, useEffect } from 'react'
import { TamaguiElement } from 'tamagui'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import TabParamList from '../../screens/Tabs/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import SearchParamList from '../../screens/Search/types'

interface UseSearchInputParams {
	inputRef: RefObject<TamaguiElement | null>
	navigation: NativeStackNavigationProp<SearchParamList>
}

/**
 * Hook to handle search input gestures, namely focusing the input when the search tab is pressed
 * while already on the search screen.
 *
 * The listener is attached to the parent tab navigator to catch tab press events.
 *
 * @param param0 The parameters for the hook, including the input reference and navigation object.
 */
export const useSearchInputGesture = ({ inputRef, navigation }: UseSearchInputParams) => {
	useEffect(() => {
		const tabNavigation = navigation.getParent<BottomTabNavigationProp<TabParamList>>()
		return tabNavigation?.addListener('tabPress', () => {
			if (navigation.isFocused()) inputRef.current?.focus()
		})
	}, [inputRef, navigation])
}
