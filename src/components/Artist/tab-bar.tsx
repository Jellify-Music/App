import React from 'react'
import { ParamListBase, useNavigation, useNavigationState } from '@react-navigation/native'
import { MaterialTopTabNavigationProp } from '@react-navigation/material-top-tabs'
import { SizableText, XStack, YStack } from 'tamagui'
import { applyHapticFeedback } from '../../utils/haptics'

/**
 * The artist page's tab bar. Each tab's list starts with the header and this, so that they scroll
 * away together with the list, which is why this is drawn here rather than by the navigator.
 */
export default function ArtistTabBar(): React.JSX.Element {
	const navigation = useNavigation<MaterialTopTabNavigationProp<ParamListBase>>()

	const names = useNavigationState((state) => state.routes.map((route) => route.name))
	const active = useNavigationState((state) => state.routes[state.index].name)

	return (
		<XStack>
			{names.map((name) => (
				<YStack
					key={name}
					flex={1}
					alignItems='center'
					paddingVertical='$3'
					borderBottomWidth={4}
					borderBottomColor={name === active ? '$primary' : 'transparent'}
					testID={`artist-${name.toLowerCase()}-tab-button`}
					role='tab'
					aria-selected={name === active}
					onPress={() => {
						if (name === active) return

						applyHapticFeedback('info')
						navigation.navigate(name)
					}}
				>
					<SizableText
						fontSize={14}
						style={{ fontFamily: 'Figtree-Bold' }}
						color={name === active ? '$primary' : '$borderColor'}
					>
						{name}
					</SizableText>
				</YStack>
			))}
		</XStack>
	)
}
