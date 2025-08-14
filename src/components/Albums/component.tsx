import { ActivityIndicator, RefreshControl } from 'react-native'
import { AlbumsProps } from '../types'
import { useDisplayContext } from '../../providers/Display/display-provider'
import { getToken, Separator, XStack, YStack } from 'tamagui'
import ItemRow from '../Global/components/item-row'
import React from 'react'
import { Text } from '../Global/helpers/text'
import { FlashList } from '@shopify/flash-list'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'

export default function Albums({
	albums,
	navigation,
	fetchNextPage,
	hasNextPage,
	isPending,
	isFetchingNextPage,
	showAlphabeticalSelector,
}: AlbumsProps): React.JSX.Element {
	const { numberOfColumns } = useDisplayContext()

	const MemoizedItem = React.memo(ItemRow)

	const itemHeight = getToken('$6')

	// Memoize key extraction function for better performance
	const keyExtractor = React.useCallback(
		(item: string | number | BaseItemDto) =>
			typeof item === 'string' ? item : typeof item === 'number' ? item.toString() : item.Id!,
		[],
	)

	// Memoize getItemType for FlashList optimization
	const getItemType = React.useCallback((item: string | number | BaseItemDto) => {
		if (typeof item === 'string') return 'header'
		if (typeof item === 'number') return 'number'
		return 'album'
	}, [])

	return (
		<XStack flex={1}>
			<FlashList
				contentContainerStyle={{
					paddingTop: getToken('$1'),
				}}
				contentInsetAdjustmentBehavior='automatic'
				data={albums ?? []}
				keyExtractor={keyExtractor}
				getItemType={getItemType}
				renderItem={({ index, item: album }) =>
					typeof album === 'string' ? (
						<XStack
							padding={'$2'}
							backgroundColor={'$background'}
							borderRadius={'$5'}
							borderWidth={'$1'}
							borderColor={'$borderColor'}
							margin={'$2'}
						>
							<Text>{album.toUpperCase()}</Text>
						</XStack>
					) : typeof album === 'number' ? null : typeof album === 'object' ? (
						<MemoizedItem
							item={album}
							queueName={album.Name ?? 'Unknown Album'}
							navigation={navigation}
						/>
					) : null
				}
				ListEmptyComponent={
					isPending ? (
						<ActivityIndicator />
					) : (
						<YStack justifyContent='center'>
							<Text>No albums</Text>
						</YStack>
					)
				}
				onEndReached={() => {
					if (hasNextPage) fetchNextPage()
				}}
				ListFooterComponent={isPending ? <ActivityIndicator /> : null}
				ItemSeparatorComponent={() => <Separator />}
				refreshControl={<RefreshControl refreshing={isPending} />}
				stickyHeaderIndices={
					showAlphabeticalSelector
						? albums
								?.map((album, index, albums) =>
									typeof album === 'string' ? index : 0,
								)
								.filter((value, index, indices) => indices.indexOf(value) === index)
						: []
				}
				removeClippedSubviews
			/>
		</XStack>
	)
}
