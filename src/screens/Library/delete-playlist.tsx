import { View, XStack } from 'tamagui'
import Button from '../../components/Global/helpers/button'
import { H5, Text } from '../../components/Global/helpers/text'
import { useMutation } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { deletePlaylist } from '../../api/mutations/playlists'
import { trigger } from 'react-native-haptic-feedback'
import { queryClient } from '../../constants/query-client'
import { QueryKeys } from '../../enums/query-keys'
import { useJellifyContext } from '../../providers'
import Icon from '../../components/Global/components/icon'
import { LibraryDeletePlaylistProps } from './types'
// import * as Burnt from 'burnt'

export default function DeletePlaylist({
	navigation,
	route,
}: LibraryDeletePlaylistProps): React.JSX.Element {
	const { api, user, library } = useJellifyContext()
	const useDeletePlaylist = useMutation({
		mutationFn: (playlist: BaseItemDto) => deletePlaylist(api, playlist.Id!),
		onSuccess: (data: void, playlist: BaseItemDto) => {
			trigger('notificationSuccess')

			navigation.goBack()
			navigation.goBack()
			// Burnt.alert({
			// 	title: `Playlist deleted`,
			// 	message: `Deleted ${playlist.Name ?? 'Untitled Playlist'}`,
			// 	duration: 1,
			// 	preset: 'done',
			// })

			// Refresh favorite playlists component in library
			queryClient.invalidateQueries({
				queryKey: [QueryKeys.FavoritePlaylists],
			})

			// Refresh home screen user playlists
			queryClient.invalidateQueries({
				queryKey: [QueryKeys.Playlists],
			})
		},
		onError: () => {
			trigger('notificationError')
		},
	})

	return (
		<View margin={'$4'}>
			<Text bold textAlign='center'>{`Delete playlist ${
				route.params.playlist.Name ?? 'Untitled Playlist'
			}?`}</Text>
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
					borderColor={'$danger'}
					onPress={() => useDeletePlaylist.mutate(route.params.playlist)}
					icon={() => <Icon name='trash-can-outline' small color={'$danger'} />}
				>
					<Text bold color={'$danger'}>
						Delete
					</Text>
				</Button>
			</XStack>
		</View>
	)
}
