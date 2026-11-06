import navigationRef from '../../../../screens/navigation'
import { StackActions } from '@react-navigation/native'
import { AddToPlaylistRowProps } from './types'
import type { ContextMenuRowImageProp } from '../types'
import ContextMenuRow from '..'

const IMAGE_PROP: ContextMenuRowImageProp = {
	iconName: 'plus-circle-outline',
}

export default function AddToPlaylistRow({
	tracks,
	source,
}: AddToPlaylistRowProps): React.JSX.Element {
	const onPress = () => {
		navigationRef.goBack()
		navigationRef.dispatch(
			StackActions.push('AddToPlaylist', {
				tracks,
				source,
			}),
		)
	}

	return <ContextMenuRow onPress={onPress} imageProp={IMAGE_PROP} label='Add to Playlist' />
}
