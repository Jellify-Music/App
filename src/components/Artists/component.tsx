import React, { useEffect, useRef } from 'react'
import { getToken, getTokenValue, Separator, useTheme, XStack, YStack } from 'tamagui'
import { Text } from '../Global/helpers/text'
import { RefreshControl } from 'react-native'
import { ArtistsProps } from '../types'
import ItemRow from '../Global/components/item-row'
import { useLibraryContext, useLibrarySortAndFilterContext } from '../../providers/Library'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { FlashList } from '@shopify/flash-list'
import { AZScroller } from '../Global/components/alphabetical-selector'
import { useMutation } from '@tanstack/react-query'

export default function Artists({
	artistsInfiniteQuery,
	navigation,
	showAlphabeticalSelector,
}: ArtistsProps): React.JSX.Element {
	const { artistPageParams } = useLibraryContext()
	const theme = useTheme()
	const { isFavorites } = useLibrarySortAndFilterContext()

	const sectionListRef = useRef<FlashList<string | number | BaseItemDto>>(null)

	const itemHeight = getToken('$6')

	const MemoizedItem = React.memo(ItemRow)

	const artistsRef = useRef<(string | number | BaseItemDto)[]>(artistsInfiniteQuery.data ?? [])

	const alphabeticalSelectorCallback = async (letter: string) => {
		console.debug(`Alphabetical Selector Callback: ${letter}`)

		do {
			if (artistPageParams.current.includes(letter)) break
			await artistsInfiniteQuery.fetchNextPage({ cancelRefetch: true })
		} while (
			!artistsRef.current.includes(letter) &&
			artistsInfiniteQuery.hasNextPage &&
			(!artistsInfiniteQuery.isFetchNextPageError || artistsInfiniteQuery.isFetchingNextPage)
		)
	}

	const { mutate: alphabetSelectorMutate, isPending: isAlphabetSelectorPending } = useMutation({
		mutationFn: (letter: string) => alphabeticalSelectorCallback(letter),
		onSuccess: (data, letter) => {
			setTimeout(() => {
				sectionListRef.current?.scrollToIndex({
					index: artistsRef.current!.indexOf(letter),
					viewPosition: 0.1,
					animated: true,
				})
			}, 500)
		},
	})

	useEffect(() => {
		artistsRef.current = artistsInfiniteQuery.data ?? []
		console.debug(`artists: ${JSON.stringify(artistsInfiniteQuery.data)}`)
	}, [artistsInfiniteQuery.data])

	return (
		<XStack flex={1}>
			<FlashList
				ref={sectionListRef}
				style={{
					width: getToken('$10'),
					marginRight: getToken('$4'),
				}}
				contentContainerStyle={{
					paddingTop: getToken('$3'),
				}}
				contentInsetAdjustmentBehavior='automatic'
				extraData={isFavorites}
				keyExtractor={(item) =>
					typeof item === 'string'
						? item
						: typeof item === 'number'
							? item.toString()
							: item.Id!
				}
				ItemSeparatorComponent={() => <Separator />}
				estimatedItemSize={itemHeight}
				data={artistsInfiniteQuery.data}
				refreshControl={
					<RefreshControl
						colors={[theme.primary.val]}
						refreshing={artistsInfiniteQuery.isPending || isAlphabetSelectorPending}
						progressViewOffset={getTokenValue('$10')}
					/>
				}
				renderItem={({ index, item: artist }) =>
					typeof artist === 'string' ? (
						// Don't render the letter if we don't have any artists that start with it
						// If the index is the last index, or the next index is not an object, then don't render the letter
						index - 1 === artistsInfiniteQuery.data!.length ||
						typeof artistsInfiniteQuery.data![index + 1] !== 'object' ? null : (
							<XStack
								padding={'$2'}
								backgroundColor={'$background'}
								borderRadius={'$5'}
								borderWidth={'$1'}
								borderColor={'$primary'}
								margin={'$2'}
							>
								<Text bold color={'$primary'}>
									{artist.toUpperCase()}
								</Text>
							</XStack>
						)
					) : typeof artist === 'number' ? null : typeof artist === 'object' ? (
						<MemoizedItem
							item={artist}
							queueName={artist.Name ?? 'Unknown Artist'}
							navigation={navigation}
						/>
					) : null
				}
				ListEmptyComponent={
					artistsInfiniteQuery.isPending ||
					artistsInfiniteQuery.isFetchingNextPage ? null : (
						<YStack justifyContent='center'>
							<Text>No artists</Text>
						</YStack>
					)
				}
				stickyHeaderIndices={
					showAlphabeticalSelector
						? artistsInfiniteQuery.data
								?.map((artist, index, artists) =>
									typeof artist === 'string' ? index : 0,
								)
								.filter((value, index, indices) => indices.indexOf(value) === index)
						: []
				}
				onStartReached={() => {
					if (artistsInfiniteQuery.hasPreviousPage)
						artistsInfiniteQuery.fetchPreviousPage()
				}}
				onEndReached={() => {
					if (artistsInfiniteQuery.hasNextPage) artistsInfiniteQuery.fetchNextPage()
				}}
				removeClippedSubviews
			/>

			{showAlphabeticalSelector && <AZScroller onLetterSelect={alphabetSelectorMutate} />}
		</XStack>
	)
}
