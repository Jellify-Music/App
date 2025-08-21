import { Spacer, XStack } from 'tamagui'

import Icon from '../../Global/components/icon'

import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../screens/types'
import { useNavigation } from '@react-navigation/native'
import { PlayerParamList } from '../../../screens/Player/types'

export default function Footer(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<PlayerParamList>>()

	return (
		<XStack justifyContent='center' alignItems='center'>
			<Spacer flex={1} />

			<XStack alignItems='center' justifyContent='flex-end' flex={1}>
				<Icon
					small
					testID='queue-button-test-id'
					name='playlist-music'
					onPress={() => {
						navigation.navigate('QueueScreen')
					}}
				/>
			</XStack>
		</XStack>
	)
}
