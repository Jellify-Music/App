import { useMutation } from '@tanstack/react-query'
import { removeFromPlaylist } from '../../../../api/mutations/playlist/utils/playlists'
import { useApi } from '../../../../stores/auth'
import navigationRef from '../../../../screens/navigation'
import { applyHapticFeedback } from '../../../../utils/haptics'
import { invalidatePlaylistTracks } from '../../../../api/queries/playlist/cache'
import { RemoveFromPlaylistRowProps } from './types'
import type { ContextMenuRowImageProp } from '../types'
import ContextMenuRow from '..'

const IMAGE_PROP: ContextMenuRowImageProp = {
	iconName: 'playlist-remove',
	color: 'warning',
}

export default function RemoveFromPlaylistRow({
	track,
	playlist,
}: RemoveFromPlaylistRowProps): React.JSX.Element {
	const api = useApi()

	const { mutate: removeTrack, isPending } = useMutation({
		mutationFn: () => removeFromPlaylist(api, track, playlist),
		onSuccess: () => {
			applyHapticFeedback('success')
			invalidatePlaylistTracks(playlist)
			navigationRef.goBack()
		},
		onError: () => {
			applyHapticFeedback('error')
		},
	})

	return (
		<ContextMenuRow
			onPress={() => removeTrack()}
			disabled={isPending}
			imageProp={IMAGE_PROP}
			label='Remove from Playlist'
		/>
	)
}
