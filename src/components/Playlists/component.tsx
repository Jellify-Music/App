import React from 'react'
import { Paragraph, useTheme, YStack } from 'tamagui'
import type { UseQueryResult } from '@tanstack/react-query'
import ItemRow from '../Global/components/item-row'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { closeAllSwipeableRows } from '../Global/components/SwipeableRow/registery'
import { RefreshControl } from 'react-native'
import { LegendListRenderItemProps } from '@legendapp/list/react-native'
import List from '../Global/components/Lists/utils'

export interface PlaylistsProps {
	query: UseQueryResult<BaseItemDto[], unknown>
}
export default function Playlists({ query }: PlaylistsProps): React.JSX.Element {
	const theme = useTheme()

	const renderItem = ({ item: playlist, index }: LegendListRenderItemProps<BaseItemDto>) => (
		<ItemRow item={playlist} testID={`playlist-item-${index}`} />
	)

	const onRefresh = () => {
		query.refetch()
	}

	return (
		<List
			data={query.data ?? []}
			refreshControl={
				<RefreshControl
					refreshing={query.isFetching}
					onRefresh={onRefresh}
					tintColor={theme.primary.val}
				/>
			}
			renderItem={renderItem}
			onScrollBeginDrag={closeAllSwipeableRows}
			ListEmptyComponent={
				<YStack flex={1} justify='center' alignItems='center'>
					<Paragraph marginVertical='auto' color='borderColor'>
						No playlists
					</Paragraph>
				</YStack>
			}
		/>
	)
}
