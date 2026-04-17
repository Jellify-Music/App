import { Spinner, XStack, YStack } from 'tamagui'
import Button from '../../components/Global/helpers/button'
import { Text } from '../../components/Global/helpers/text'
import { useMutation } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { deletePlaylist } from '../../api/mutations/playlists'
import { queryClient } from '../../constants/query-client'
import Icon from '../../components/Global/components/icon'
import { DeletePlaylistProps } from '../types'
import { triggerHaptic } from '../../hooks/use-haptic-feedback'
import { getApi, getUser } from '../../stores'
import { UserPlaylistsQueryKey } from '../../api/queries/playlist/keys'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PlaylistLibraryQuery } from '../../api/queries/libraries/queries'

export default function DeletePlaylist({
	navigation,
	route,
}: DeletePlaylistProps): React.JSX.Element {
	const useDeletePlaylist = useMutation({
		mutationFn: (playlist: BaseItemDto) => {
			const api = getApi()
			return deletePlaylist(api, playlist.Id!)
		},
		onSuccess: async (data: void, playlist: BaseItemDto) => {
			const api = getApi()
			const user = getUser()

			triggerHaptic('notificationSuccess')

			navigation.goBack() // Dismiss modal

			route.params.onDelete()

			const playlistLibrary = await queryClient.ensureQueryData<BaseItemDto | undefined>(
				PlaylistLibraryQuery(api, user),
			)

			if (playlistLibrary) {
				queryClient.refetchQueries({
					queryKey: UserPlaylistsQueryKey(playlistLibrary, user),
				})
			}
		},
		onError: () => {
			triggerHaptic('notificationError')
		},
	})

	const { bottom } = useSafeAreaInsets()

	return (
		<YStack margin={'$4'} gap={'$4'} justifyContent='space-between' marginBottom={bottom}>
			<Text bold textAlign='center'>
				{`Delete playlist ${route.params.playlist.Name ?? 'Untitled Playlist'}?`}
			</Text>
			<XStack justifyContent='space-evenly' gap={'$2'}>
				<Button
					onPress={() => navigation.goBack()}
					flex={1}
					borderWidth={'$1'}
					borderColor={'$borderColor'}
					icon={() => <Icon name='chevron-left' small color={'$borderColor'} />}
				>
					<Text bold color={'$borderColor'}>
						Cancel
					</Text>
				</Button>
				<Button
					danger
					flex={1}
					borderWidth={'$1'}
					borderColor={'$warning'}
					onPress={() => useDeletePlaylist.mutate(route.params.playlist)}
					icon={() =>
						useDeletePlaylist.isPending && (
							<Icon name='trash-can-outline' small color={'$warning'} />
						)
					}
				>
					{useDeletePlaylist.isPending ? (
						<Spinner color={'$warning'} />
					) : (
						<Text bold color={'$warning'}>
							Delete
						</Text>
					)}
				</Button>
			</XStack>
		</YStack>
	)
}
