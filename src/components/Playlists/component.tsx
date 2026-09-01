import React from 'react'
import { Paragraph, useTheme, YStack } from 'tamagui'
import ItemRow from '../Global/components/item-row'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { FetchNextPageOptions } from '@tanstack/react-query'
import { closeAllSwipeableRows } from '../Global/components/SwipeableRow/registery'
import { RefreshControl } from 'react-native'
import { Text } from '../Global/helpers/text'
import { LegendListRenderItemProps } from '@legendapp/list/react-native'
import List from '../Global/helpers/list'

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

	const renderItem = ({ item: playlist, index }: LegendListRenderItemProps<BaseItemDto>) => (
		<ItemRow item={playlist} testID={`playlist-item-${index}`} />
	)

	// Memoized end reached handler
	const handleEndReached = () => {
		if (hasNextPage) {
			fetchNextPage()
		}
	}

	return (
		<List
			data={playlists}
			refreshControl={
				<RefreshControl
					refreshing={isPending || isFetchingNextPage}
					onRefresh={refetch}
					tintColor={theme.primary.val}
				/>
			}
			renderItem={renderItem}
			onEndReached={handleEndReached}
			onScrollBeginDrag={closeAllSwipeableRows}
			ListEmptyComponent={
				<YStack flex={1} justify='center' alignItems='center'>
					<Paragraph marginVertical='auto' color={'$borderColor'}>
						No playlists
					</Paragraph>
				</YStack>
			}
		/>
	)
}
