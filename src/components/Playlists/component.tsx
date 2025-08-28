import { RefreshControl } from 'react-native-gesture-handler'
import { Separator } from 'tamagui'
import { FlashList, ViewToken } from '@shopify/flash-list'
import ItemRow from '../Global/components/item-row'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { FetchNextPageOptions } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import { BaseStackParamList } from '@/src/screens/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useRef } from 'react'
import { warmItemContext } from '../../hooks/use-item-context'
import { useJellifyContext } from '../../providers'
import useStreamingDeviceProfile from '../../stores/device-profile'

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

	const { api, user } = useJellifyContext()

	const deviceProfile = useStreamingDeviceProfile()

	const onViewableItemsChangedRef = useRef(
		({ viewableItems }: { viewableItems: ViewToken<BaseItemDto>[] }) => {
			viewableItems.forEach(({ isViewable, item }) => {
				if (isViewable) warmItemContext(api, user, item, deviceProfile)
			})
		},
	)

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
			onViewableItemsChanged={onViewableItemsChangedRef.current}
		/>
	)
}
