import React, { useEffect, useMemo, useRef, useState } from 'react'
import { getToken, Separator, XStack, YStack } from 'tamagui'
import { Text } from '../Global/helpers/text'
import { ActivityIndicator, FlatList, RefreshControl } from 'react-native'
import { ArtistsProps } from '../types'
import ItemRow from '../Global/components/item-row'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { alphabet, useLibrarySortAndFilterContext } from '../../providers/Library'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { FlashList } from '@shopify/flash-list'
import { useLibraryContext } from '../../providers/Library'
import { sleepify } from '../../utils/sleep'
import { AZScroller } from '../Global/components/alphabetical-selector'
import { useMutation } from '@tanstack/react-query'

export default function Artists({
	artists,
	navigation,
	fetchNextPage,
	hasNextPage,
	isPending,
	isFetchingNextPage,
	showAlphabeticalSelector,
}: ArtistsProps): React.JSX.Element {
	const { width, height } = useSafeAreaFrame()

	const { artistPageParams } = useLibraryContext()

	const { isFavorites } = useLibrarySortAndFilterContext()

	const memoizedAlphabet = useMemo(() => alphabet, [])

	const sectionListRef = useRef<FlashList<string | number | BaseItemDto>>(null)

	const itemHeight = getToken('$6')

	const MemoizedItem = React.memo(ItemRow)

	const artistsRef = useRef<(string | number | BaseItemDto)[]>(artists ?? [])

	const alphabeticalSelectorCallback = async (letter: string) => {
		console.debug(`Alphabetical Selector Callback: ${letter}`)
		do {
			await sleepify(100)
			fetchNextPage()
			console.debug(
				`Alphabetical Selector Callback: ${letter}, ${artistPageParams.current.join(', ')}`,
			)
		} while (
			(artistsRef.current?.indexOf(letter) === -1 ||
				!artistPageParams.current.includes(letter)) &&
			hasNextPage
		)
	}

	const { mutate: alphabetSelectorMutate, isPending: isAlphabetSelectorPending } = useMutation({
		mutationFn: (letter: string) => alphabeticalSelectorCallback(letter),
		onSuccess: (data, letter) => {
			sectionListRef.current?.scrollToIndex({
				index: artistsRef.current!.indexOf(letter),
				viewPosition: 0.1,
				animated: true,
			})
		},
	})

	useEffect(() => {
		artistsRef.current = artists ?? []
		console.debug(`artists: ${JSON.stringify(artists)}`)
	}, [artists])

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
				data={artists}
				refreshControl={
					<RefreshControl refreshing={isPending || isAlphabetSelectorPending} />
				}
				renderItem={({ index, item: artist }) =>
					typeof artist === 'string' ? (
						// Don't render the letter if we don't have any artists that start with it
						// If the index is the last index, or the next index is not an object, then don't render the letter
						index - 1 === artists!.length ||
						typeof artists![index + 1] !== 'object' ? null : (
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
					isPending || isFetchingNextPage ? null : (
						<YStack justifyContent='center'>
							<Text>No artists</Text>
						</YStack>
					)
				}
				stickyHeaderIndices={
					showAlphabeticalSelector
						? artists
								?.map((artist, index, artists) =>
									typeof artist === 'string' ? index : 0,
								)
								.filter((value, index, indices) => indices.indexOf(value) === index)
						: []
				}
				onEndReached={() => {
					if (hasNextPage) fetchNextPage()
				}}
				removeClippedSubviews={false}
			/>

			{showAlphabeticalSelector && <AZScroller onLetterSelect={alphabetSelectorMutate} />}
		</XStack>
	)
}
