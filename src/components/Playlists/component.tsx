import { RefreshControl } from 'react-native-gesture-handler'
import { Separator } from 'tamagui'
import { FlashList } from '@shopify/flash-list'
import ItemRow from '../Global/components/item-row'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { FetchNextPageOptions } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import { BaseStackParamList } from '@/src/screens/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

export interface PlaylistsProps {
	canEdit?: boolean | undefined
	playlists: BaseItemDto[] | undefined
	refetch: () => void
	fetchNextPage: (options?: FetchNextPageOptions | undefined) => void
	hasNextPage: boolean
	isPending: boolean
	isFetchingNextPage: boolean
}
export default function Playlists({
	playlists,
	refetch,
	fetchNextPage,
	hasNextPage,
	isPending,
	isFetchingNextPage,
	canEdit,
}: PlaylistsProps): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()

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
					queueName={playlist.Name ?? 'Untitled Playlist'}
					navigation={navigation}
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
