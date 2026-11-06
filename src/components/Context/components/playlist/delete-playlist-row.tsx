import navigationRef from '../../../../screens/navigation'
import { StackActions } from '@react-navigation/native'
import { DeletePlaylistRowProps } from './types'
import type { ContextMenuRowImageProp } from '../types'
import ContextMenuRow from '..'

const IMAGE_PROP: ContextMenuRowImageProp = {
	iconName: 'delete',
	color: 'warning',
}

export default function DeletePlaylistRow({ playlist }: DeletePlaylistRowProps): React.JSX.Element {
	const onPress = () => {
		navigationRef.dispatch(
			StackActions.push('DeletePlaylist', {
				playlist,
				onDelete: navigationRef.goBack,
			}),
		)
	}

	return <ContextMenuRow onPress={onPress} imageProp={IMAGE_PROP} label='Delete Playlist' />
}
