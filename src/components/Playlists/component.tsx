import { RefreshControl } from 'react-native-gesture-handler'
import { Separator } from 'tamagui'
import { PlaylistsProps } from '../types'
import { FlashList } from '@shopify/flash-list'
import ItemRow from '../Global/components/item-row'

export default function Playlists({
	playlists,
	navigation,
	refetch,
	fetchNextPage,
	hasNextPage,
	isPending,
	isFetchingNextPage,
	canEdit,
}: PlaylistsProps): React.JSX.Element {
	return (
		<FlashList
			contentInsetAdjustmentBehavior='automatic'
			data={playlists}
			refreshControl={
				<RefreshControl refreshing={isPending || isFetchingNextPage} onRefresh={refetch} />
			}
			ItemSeparatorComponent={() => <Separator />}
			renderItem={({ index, item: playlist }) => (
				<ItemRow
					item={playlist}
					onPress={() => {
						navigation.navigate('Playlist', { playlist, canEdit })
					}}
					navigation={navigation}
					queueName={playlist.Name ?? 'Untitled Playlist'}
				/>
			)}
			onEndReached={() => {
				if (hasNextPage) {
					fetchNextPage()
				}
			}}
			removeClippedSubviews
		/>
	)
}
