import { ActivityIndicator, RefreshControl } from 'react-native'
import { useDisplayContext } from '../../providers/Display/display-provider'
import { getToken, Separator, XStack, YStack } from 'tamagui'
import React from 'react'
import { Text } from '../Global/helpers/text'
import { FlashList } from '@shopify/flash-list'
import { FetchNextPageOptions } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import ItemRow from '../Global/components/item-row'

interface AlbumsProps {
	albums: (string | number | BaseItemDto)[] | undefined
	fetchNextPage: (options?: FetchNextPageOptions | undefined) => void
	hasNextPage: boolean
	isPending: boolean
	isFetchingNextPage: boolean
	showAlphabeticalSelector: boolean
}

export default function Albums({
	albums,
	fetchNextPage,
	hasNextPage,
	isPending,
	showAlphabeticalSelector,
}: AlbumsProps): React.JSX.Element {
	useDisplayContext()

	const itemHeight = getToken('$6')

	// Memoize expensive stickyHeaderIndices calculation to prevent unnecessary re-computations
	const stickyHeaderIndices = React.useMemo(() => {
		if (!showAlphabeticalSelector || !albums) return []

		return albums
			.map((album, index) => (typeof album === 'string' ? index : 0))
			.filter((value, index, indices) => indices.indexOf(value) === index)
	}, [showAlphabeticalSelector, albums])

	return (
		<XStack flex={1}>
			<FlashList
				contentContainerStyle={{
					paddingTop: getToken('$1'),
				}}
				contentInsetAdjustmentBehavior='automatic'
				data={albums ?? []}
				keyExtractor={(item) =>
					typeof item === 'string'
						? item
						: typeof item === 'number'
							? item.toString()
							: item.Id!
				}
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
						<ItemRow item={album} queueName={album.Name ?? 'Unknown Album'} />
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
				stickyHeaderIndices={stickyHeaderIndices}
				removeClippedSubviews
			/>
		</XStack>
	)
}
