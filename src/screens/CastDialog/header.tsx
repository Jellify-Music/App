import Icon from '../../components/Global/components/icon'
import { NativeStackHeaderItemProps } from '@react-navigation/native-stack'
import { Platform } from 'react-native'
import { AudioRoutePicker } from 'react-native-nitro-player'
import { Paragraph, XStack } from 'tamagui'

function onHeaderRightPress() {
	AudioRoutePicker?.showRoutePicker()
}

export default function CastDialogHeaderRight(props: NativeStackHeaderItemProps) {
	return Platform.OS === 'ios' ? (
		<XStack alignItems='center'>
			<Icon name='cast-audio-variant' />

			<Paragraph>Show More</Paragraph>
		</XStack>
	) : null
}
