import { XStack } from 'tamagui'

import Icon from '../../Global/components/icon'

import { StackNavigationProp } from '@react-navigation/stack'
import { StackParamList } from '../../types'

export default function Footer({
	navigation,
}: {
	navigation: StackNavigationProp<StackParamList>
}): React.JSX.Element {
	return (
		<XStack
			justifyContent='flex-end'
			alignItems='center'
			marginHorizontal={'$4'}
			flexGrow={2}
			flexShrink={1}
		>
			<XStack alignItems='center' justifyContent='flex-start' flex={1}>
				<Icon small name='speaker-multiple' disabled />
			</XStack>

			<XStack alignItems='center' justifyContent='flex-end' flex={1}>
				<Icon
					small
					name='playlist-music'
					onPress={() => {
						navigation.navigate('Queue')
					}}
				/>
			</XStack>
		</XStack>
	)
}
