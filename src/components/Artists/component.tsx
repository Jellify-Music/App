import React, { RefObject, useEffect, useRef } from 'react'
import { Separator, useTheme, XStack, YStack } from 'tamagui'
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
import FlashListStickyHeader from '../Global/helpers/flashlist-sticky-header'
import { closeAllSwipeableRows } from '../Global/components/swipeable-row-registry'

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

	const { mutateAsync: alphabetSelectorMutate, isPending: isAlphabetSelectorPending } =
		useAlphabetSelector((letter) => (pendingLetterRef.current = letter.toUpperCase()))

	const stickyHeaderIndices =
		!showAlphabeticalSelector || !artists
			? []
			: artists
					.map((artist, index, artists) => (typeof artist === 'string' ? index : 0))
					.filter((value, index, indices) => indices.indexOf(value) === index)

	const ItemSeparatorComponent = ({
		leadingItem,
		trailingItem,
	}: {
		leadingItem: unknown
		trailingItem: unknown
	}) =>
		typeof leadingItem === 'string' || typeof trailingItem === 'string' ? null : <Separator />

	const KeyExtractor = (item: BaseItemDto | string | number, index: number) =>
		typeof item === 'string' ? item : typeof item === 'number' ? item.toString() : item.Id!

	const renderItem = ({
		index,
		item: artist,
	}: {
		index: number
		item: BaseItemDto | number | string
	}) =>
		typeof artist === 'string' ? (
			// Don't render the letter if we don't have any artists that start with it
			// If the index is the last index, or the next index is not an object, then don't render the letter
			index - 1 === artists.length || typeof artists[index + 1] !== 'object' ? null : (
				<FlashListStickyHeader text={artist.toUpperCase()} />
			)
		) : typeof artist === 'number' ? null : typeof artist === 'object' ? (
			<ItemRow circular item={artist} navigation={navigation} />
		) : null

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
				contentInsetAdjustmentBehavior='automatic'
				ref={sectionListRef}
				extraData={isFavorites}
				keyExtractor={KeyExtractor}
				ItemSeparatorComponent={ItemSeparatorComponent}
				ListEmptyComponent={
					<YStack flex={1} justify='center' alignItems='center'>
						<Text marginVertical='auto' color={'$borderColor'}>
							No artists
						</Text>
					</YStack>
				}
				data={artists}
				refreshControl={
					<RefreshControl
						refreshing={artistsInfiniteQuery.isPending && !isAlphabetSelectorPending}
						onRefresh={() => artistsInfiniteQuery.refetch()}
						tintColor={theme.primary.val}
					/>
				}
				renderItem={renderItem}
				stickyHeaderIndices={stickyHeaderIndices}
				onStartReached={() => {
					if (artistsInfiniteQuery.hasPreviousPage)
						artistsInfiniteQuery.fetchPreviousPage()
				}}
				onEndReached={() => {
					if (artistsInfiniteQuery.hasNextPage && !artistsInfiniteQuery.isFetching)
						artistsInfiniteQuery.fetchNextPage()
				}}
				onScrollBeginDrag={closeAllSwipeableRows}
				removeClippedSubviews
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
