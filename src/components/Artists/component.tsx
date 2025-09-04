import React, { RefObject, useEffect, useMemo, useRef } from 'react'
import { getToken, Separator, useTheme, XStack } from 'tamagui'
import { Text } from '../Global/helpers/text'
import { RefreshControl } from 'react-native'
import ItemRow from '../Global/components/item-row'
import { useLibrarySortAndFilterContext } from '../../providers/Library'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { FlashList, FlashListRef } from '@shopify/flash-list'
import AZScroller, { useAlphabetSelector } from '../Global/components/alphabetical-selector'
import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { isString } from 'lodash'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import LibraryStackParamList from '../../screens/Library/types'

export interface ArtistsProps {
	artistsInfiniteQuery: UseInfiniteQueryResult<
		BaseItemDto[] | (string | number | BaseItemDto)[],
		Error
	>
	showAlphabeticalSelector: boolean
	artistPageParams?: RefObject<Set<string>>
}

/**
 * @param artistsInfiniteQuery - The infinite query for artists
 * @param navigation - The navigation object
 * @param showAlphabeticalSelector - Whether to show the alphabetical selector
 * @param artistPageParams - The page params for the artists - which are the A-Z letters that have been seen
 * @returns The Artists component
 */
export default function Artists({
	artistsInfiniteQuery,
	showAlphabeticalSelector,
	artistPageParams,
}: ArtistsProps): React.JSX.Element {
	const theme = useTheme()

	const { isFavorites } = useLibrarySortAndFilterContext()

	const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>()

	const artists = artistsInfiniteQuery.data ?? []
	const sectionListRef = useRef<FlashListRef<string | number | BaseItemDto>>(null)

	const pendingLetterRef = useRef<string | null>(null)

	const { mutate: alphabetSelectorMutate, isPending: isAlphabetSelectorPending } =
		useAlphabetSelector((letter) => (pendingLetterRef.current = letter.toUpperCase()))

	const stickyHeaderIndices = useMemo(() => {
		if (!showAlphabeticalSelector || !artists) return []

		return artists
			.map((artist, index, artists) => (typeof artist === 'string' ? index : 0))
			.filter((value, index, indices) => indices.indexOf(value) === index)
	}, [showAlphabeticalSelector, artists])

	// Effect for handling the pending alphabet selector letter
	useEffect(() => {
		if (isString(pendingLetterRef.current) && artists) {
			const upperLetters = artists
				.filter((item): item is string => typeof item === 'string')
				.map((letter) => letter.toUpperCase())
				.sort()

			const index = upperLetters.findIndex((letter) => letter >= pendingLetterRef.current!)

			if (index !== -1) {
				const letterToScroll = upperLetters[index]
				const scrollIndex = artists.indexOf(letterToScroll)
				if (scrollIndex !== -1) {
					sectionListRef.current?.scrollToIndex({
						index: scrollIndex,
						viewPosition: 0.1,
						animated: true,
					})
				}
			} else {
				// fallback: scroll to last section
				const lastLetter = upperLetters[upperLetters.length - 1]
				const scrollIndex = artists.indexOf(lastLetter)
				if (scrollIndex !== -1) {
					sectionListRef.current?.scrollToIndex({
						index: scrollIndex,
						viewPosition: 0.1,
						animated: true,
					})
				}
			}

			pendingLetterRef.current = null
		}
	}, [pendingLetterRef.current, artistsInfiniteQuery.data])

	return (
		<XStack flex={1}>
			<FlashList
				ref={sectionListRef}
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
				data={artists}
				refreshControl={
					<RefreshControl
						refreshing={artistsInfiniteQuery.isFetching || isAlphabetSelectorPending}
						onRefresh={() => artistsInfiniteQuery.refetch()}
						tintColor={theme.primary.val}
					/>
				}
				renderItem={({ index, item: artist }) =>
					typeof artist === 'string' ? (
						// Don't render the letter if we don't have any artists that start with it
						// If the index is the last index, or the next index is not an object, then don't render the letter
						index - 1 === artists.length ||
						typeof artists[index + 1] !== 'object' ? null : (
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
						<ItemRow
							circular
							item={artist}
							queueName={artist.Name ?? 'Unknown Artist'}
							navigation={navigation}
						/>
					) : null
				}
				stickyHeaderIndices={stickyHeaderIndices}
				onStartReached={() => {
					if (artistsInfiniteQuery.hasPreviousPage)
						artistsInfiniteQuery.fetchPreviousPage()
				}}
				onEndReached={() => {
					if (artistsInfiniteQuery.hasNextPage && !artistsInfiniteQuery.isFetching)
						artistsInfiniteQuery.fetchNextPage()
				}}
				// onEndReachedThreshold default is 0.5
			/>

			{showAlphabeticalSelector && artistPageParams && (
				<AZScroller
					onLetterSelect={(letter) =>
						alphabetSelectorMutate({
							letter,
							infiniteQuery: artistsInfiniteQuery,
							pageParams: artistPageParams,
						})
					}
				/>
			)}
		</XStack>
	)
}
