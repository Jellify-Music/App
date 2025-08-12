import { XStack } from 'tamagui'

import Icon from '../../Global/components/icon'

import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackParamList } from '../../types'

export default function Footer({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	return (
		<XStack
			justifyContent='flex-end'
			alignItems='center'
			marginHorizontal={'$5'}
			flex={1}
			marginBottom={'$4'}
		>
			<XStack alignItems='center' justifyContent='flex-start' flex={1}>
				<Icon small name='cast-audio' disabled />
			</XStack>

			<XStack alignItems='center' justifyContent='flex-end' flex={1}>
				<Icon
					small
					testID='queue-button-test-id'
					name='playlist-music'
					onPress={() => {
						navigation.navigate('Queue')
					}}
				/>
			</XStack>
		</XStack>
	)
}
