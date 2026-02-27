import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { ListItem } from 'tamagui'
import Icon from '../../Global/components/icon'
import { Text } from '../../Global/helpers/text'
import { useMutation } from '@tanstack/react-query'
import { removeFromPlaylist } from '../../../api/mutations/playlists'
import { useApi } from '../../../stores'
import navigationRef from '../../../../navigation'
import { triggerHaptic } from '../../../hooks/use-haptic-feedback'
import { queryClient } from '../../../constants/query-client'
import { PlaylistTracksQueryKey } from '../../../api/queries/playlist/keys'

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
			animation={'quick'}
			backgroundColor={'transparent'}
			disabled={isPending}
			flex={1}
			gap={'$2.5'}
			justifyContent='flex-start'
			onPress={() => removeTrack()}
			pressStyle={{ opacity: 0.5 }}
		>
			<Icon small color='$warning' name='playlist-remove' />

			<Text bold>Remove from Playlist</Text>
		</ListItem>
	)
}
