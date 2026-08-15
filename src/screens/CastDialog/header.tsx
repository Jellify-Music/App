import Icon from '../../components/Global/components/icon'
import { NativeStackHeaderItemProps } from '@react-navigation/native-stack'
import { Platform } from 'react-native'
import { AudioRoutePicker } from 'react-native-nitro-player'

function onHeaderRightPress() {
	AudioRoutePicker?.showRoutePicker()
}

export default function CastDialogHeaderRight(props: NativeStackHeaderItemProps) {
	return Platform.OS === 'ios' ? (
		<Icon name='cast-audio-variant' onPress={onHeaderRightPress} />
	) : null
}
