import React, { useRef } from 'react'
import { useTheme, XStack, YStack } from 'tamagui'
import { Text } from '../Global/helpers/text'
import ItemRow from '../Global/components/item-row'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import AZScroller from '../Global/components/alphabetical-selector'
import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { isString } from 'lodash'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import LibraryStackParamList from '../../screens/Library/types'
import FlashListStickyHeader from '../Global/helpers/flashlist-sticky-header'
import { closeAllSwipeableRows } from '../Global/components/SwipeableRow/registery'
import useLibraryStore from '../../stores/library'
import { RefreshControl } from 'react-native'
import { SectionList, SectionListRef } from '@legendapp/list/section-list'
import ItemKeyExtractor from '../../utils/parsing/key-extractor'

export interface ArtistsProps {
	artistsInfiniteQuery: UseInfiniteQueryResult<
		{
			title: string
			data: BaseItemDto[]
		}[],
		Error
	>
	showAlphabeticalSelector: boolean
	sortDescending?: boolean
	onLetterSelect?: (letter: string) => void
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
	sortDescending,
	...props
}: ArtistsProps): React.JSX.Element {
	const theme = useTheme()

	const isFavorites = useLibraryStore((state) => state.filters.artists.isFavorites)

	const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>()

	const artists = artistsInfiniteQuery.data ?? []
	const sectionListRef = useRef<SectionListRef>(null)

	const pendingLetterRef = useRef<string | null>(null)

	const stickyHeaderIndices =
		!showAlphabeticalSelector || !artists
			? []
			: artists
					.map((artist, index, artists) => (typeof artist === 'string' ? index : 0))
					.filter((value, index, indices) => indices.indexOf(value) === index)

	// Precompute a stable list-index → object-index map so renderItem can build
	// `artist-item-N` testIDs in O(1) instead of slicing/filtering the full list
	// on every row render. React Compiler memoizes this on `artists` identity.
	const objectIndexByListIndex: number[] = []
	{
		let count = 0
		for (let i = 0; i < artists.length; i++) {
			if (typeof artists[i] === 'object') {
				objectIndexByListIndex[i] = count++
			}
		}
	}

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
			<ItemRow
				circular
				item={artist}
				navigation={navigation}
				testID={`artist-item-${objectIndexByListIndex[index]}`}
			/>
		) : null

	const onLetterSelect = async (letter: string) => {
		console.debug('selecting letter')

		// Fetch page
		props.onLetterSelect?.(letter)

		if (isString(letter) && artists) {
			const upperLetters = artists.map(({ title }) => title.toUpperCase()).sort()

			const index = upperLetters.findIndex((letter) => letter >= pendingLetterRef.current!)

			if (index !== -1) {
				sectionListRef.current?.scrollToLocation({
					sectionIndex: index,
					itemIndex: 0,
					viewPosition: 0.1,
					animated: true,
				})
			} else {
				// fallback: scroll to last section
				const lastLetter = upperLetters[upperLetters.length - 1]
				const scrollIndex = artists
					.map(({ title }) => title.toUpperCase())
					.indexOf(lastLetter)
				if (scrollIndex !== -1) {
					sectionListRef.current?.scrollToIndex({
						index: scrollIndex,
						viewPosition: 0.1,
						animated: true,
					})
				}
			}
		}
	}

	return (
		<XStack flex={1}>
			<SectionList
				contentInsetAdjustmentBehavior='automatic'
				ref={sectionListRef}
				extraData={isFavorites}
				keyExtractor={ItemKeyExtractor}
				ListEmptyComponent={
					<YStack flex={1} justify='center' alignItems='center'>
						<Text marginVertical='auto' color={'$borderColor'}>
							No artists
						</Text>
					</YStack>
				}
				sections={artists}
				refreshControl={
					<RefreshControl
						refreshing={artistsInfiniteQuery.isPending}
						onRefresh={artistsInfiniteQuery.refetch}
						tintColor={theme.primary.val}
					/>
				}
				renderItem={renderItem}
				renderSectionHeader={({ section }) => (
					<FlashListStickyHeader text={section.title} />
				)}
				onStartReachedThreshold={0.9}
				onStartReached={() => {
					pendingLetterRef.current = null
					if (artistsInfiniteQuery.hasPreviousPage)
						artistsInfiniteQuery.fetchPreviousPage()
				}}
				onEndReachedThreshold={0.1}
				onEndReached={() => {
					pendingLetterRef.current = null
					if (artistsInfiniteQuery.hasNextPage && !artistsInfiniteQuery.isFetching)
						artistsInfiniteQuery.fetchNextPage()
				}}
				onScrollBeginDrag={closeAllSwipeableRows}
			/>

			{showAlphabeticalSelector && (
				<AZScroller reverseOrder={sortDescending} onLetterSelect={onLetterSelect} />
			)}
		</XStack>
	)
}
