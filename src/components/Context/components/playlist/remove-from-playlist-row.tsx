import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { ListItem, SizableText } from 'tamagui'
import Icon from '../../../Global/components/icon'
import { useMutation } from '@tanstack/react-query'
import { removeFromPlaylist } from '../../../../api/mutations/playlist/utils/playlists'
import { useApi } from '../../../../stores/auth'
import navigationRef from '../../../../screens/navigation'
import { triggerHaptic } from '../../../../hooks/use-haptic-feedback'
import { queryClient } from '../../../../constants/query-client'
import { PlaylistTracksQueryKey } from '../../../../api/queries/playlist/keys'

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
			triggerHaptic('notificationSuccess')
			queryClient.invalidateQueries({ queryKey: PlaylistTracksQueryKey(playlist) })
			navigationRef.goBack()
		},
		onError: () => {
			triggerHaptic('notificationError')
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
