import React, { useCallback } from 'react'
import { Separator, useTheme } from 'tamagui'
import { FlashList } from '@shopify/flash-list'
import ItemRow from '../Global/components/item-row'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { FetchNextPageOptions } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import { BaseStackParamList } from '@/src/screens/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { closeAllSwipeableRows } from '../Global/components/swipeable-row-registry'
import { RefreshControl } from 'react-native'

// Extracted as stable component to prevent recreation on each render
function ListSeparatorComponent(): React.JSX.Element {
	return <Separator />
}
const ListSeparator = React.memo(ListSeparatorComponent)

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
	const theme = useTheme()

	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()

	// Memoized key extractor to prevent recreation on each render
	const keyExtractor = useCallback((item: BaseItemDto) => item.Id!, [])

	// Memoized render item to prevent recreation on each render
	const renderItem = useCallback(
		({ item: playlist }: { index: number; item: BaseItemDto }) => (
			<ItemRow item={playlist} navigation={navigation} />
		),
		[navigation],
	)

	// Memoized end reached handler
	const handleEndReached = useCallback(() => {
		if (hasNextPage) {
			fetchNextPage()
		}
	}, [hasNextPage, fetchNextPage])

	return (
		<FlashList
			contentInsetAdjustmentBehavior='automatic'
			data={playlists}
			keyExtractor={keyExtractor}
			refreshControl={
				<RefreshControl
					refreshing={isPending || isFetchingNextPage}
					onRefresh={refetch}
					tintColor={theme.primary.val}
				/>
			}
			ItemSeparatorComponent={ListSeparator}
			renderItem={renderItem}
			onEndReached={handleEndReached}
			removeClippedSubviews
			onScrollBeginDrag={closeAllSwipeableRows}
		/>
	)
}
