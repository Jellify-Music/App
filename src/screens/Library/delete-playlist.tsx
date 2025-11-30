import { Spinner, View, XStack } from 'tamagui'
import Button from '../../components/Global/helpers/button'
import { Text } from '../../components/Global/helpers/text'
import Icon from '../../components/Global/components/icon'
import { LibraryDeletePlaylistProps } from './types'
import { useDeletePlaylist } from '../../api/mutations/playlist'

export default function DeletePlaylist({
	navigation,
	route,
}: LibraryDeletePlaylistProps): React.JSX.Element {
	const deletePlaylistMutation = useDeletePlaylist()

	const handleDelete = () => {
		deletePlaylistMutation.mutate(
			{ playlistId: route.params.playlist.Id! },
			{
				onSuccess: () => {
					navigation.goBack()
					navigation.goBack()
				},
			},
		)
	}

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
					onPress={handleDelete}
					disabled={deletePlaylistMutation.isPending}
					icon={() =>
						deletePlaylistMutation.isPending && (
							<Icon name='trash-can-outline' small color={'$danger'} />
						)
					}
				>
					{deletePlaylistMutation.isPending ? (
						<Spinner color={'$danger'} />
					) : (
						<Text bold color={'$danger'}>
							Delete
						</Text>
					)}
				</Button>
			</XStack>
		</View>
	)
}
