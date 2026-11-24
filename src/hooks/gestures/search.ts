import { RefObject, useEffect } from 'react'
import { TamaguiElement } from 'tamagui'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import TabParamList from '../../screens/Tabs/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import SearchParamList from '../../screens/Search/types'
import { applyHapticFeedback } from '../../utils/haptics'

export type InputRefObject = RefObject<TamaguiElement | null>

interface UseSearchInputParams {
	inputRef: InputRefObject
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
		return tabNavigation?.addListener('tabPress', () => tabPressHandler(inputRef, navigation))
	}, [inputRef, navigation])
}

/**
 * Handles the tab press event for the search tab, focusing the input if the search screen is already focused.
 *
 * @param inputRef The reference to the search input element.
 * @param navigation The navigation object for the search screen.
 */
function tabPressHandler(
	inputRef: InputRefObject,
	navigation: NativeStackNavigationProp<SearchParamList>,
) {
	if (navigation.isFocused()) {
		applyHapticFeedback('info')
		inputRef.current?.focus()
	}
}
