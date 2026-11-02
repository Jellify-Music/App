import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { ListItem, SizableText } from 'tamagui'
import Icon from '../../../Global/components/icon'
import { useMutation } from '@tanstack/react-query'
import { removeFromPlaylist } from '../../../../api/mutations/playlist/utils/playlists'
import { useApi } from '../../../../stores/auth'
import navigationRef from '../../../../screens/navigation'
import { applyHapticFeedback } from '../../../../utils/haptics'
import { invalidatePlaylistTracks } from '../../../../api/queries/playlist/cache'

export default function RemoveFromPlaylistRow({
	track,
	playlist,
}: {
	track: BaseItemDto
	playlist: BaseItemDto
}): React.JSX.Element {
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
		<ListItem
			transition={'quick'}
			opacity='1 press:0.5'
			backgroundColor={'transparent'}
			flex={1}
			gap='2-5'
			justifyContent='flex-start'
			disabled={isPending}
			onPress={() => removeTrack()}
		>
			<Icon fontSize={'7'} color='warning' name='playlist-remove' />

			<SizableText fontWeight='6'>Remove from Playlist</SizableText>
		</ListItem>
	)
}
