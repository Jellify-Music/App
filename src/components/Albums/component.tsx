import { ActivityIndicator, RefreshControl } from 'react-native'
import { AlbumsProps } from '../types'
import { useDisplayContext } from '../../providers/Display/display-provider'
import { getToken, Separator, XStack, YStack } from 'tamagui'
import ItemRow from '../Global/components/item-row'
import React from 'react'
import { Text } from '../Global/helpers/text'
import { FlashList } from '@shopify/flash-list'

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

	return (
		<XStack flex={1}>
			<FlashList
				contentContainerStyle={{
					paddingTop: getToken('$1'),
				}}
				contentInsetAdjustmentBehavior='automatic'
				data={albums ?? []}
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
				keyExtractor={(item) =>
					typeof item === 'string'
						? item
						: typeof item === 'number'
							? item.toString()
							: item.Id!
				}
				estimatedItemSize={itemHeight}
				onEndReachedThreshold={0.25}
				removeClippedSubviews
			/>
		</XStack>
	)
}
