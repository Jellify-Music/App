import { useTheme, XStack, YStack } from 'tamagui'
import React, { RefObject, useEffect, useRef } from 'react'
import { Text } from '../Global/helpers/text'
import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import ItemRow from '../Global/components/item-row'
import { useNavigation } from '@react-navigation/native'
import LibraryStackParamList from '../../screens/Library/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import AZScroller from '../Global/components/alphabetical-selector'
import { isString } from 'lodash'
import ItemListStickyHeader from '../Global/helpers/item-list-sticky-header'
import { closeAllSwipeableRows } from '../Global/components/SwipeableRow/registery'
import useLibraryStore from '../../stores/library'
import { RefreshControl } from 'react-native'
import LegendItemList from '../Global/helpers/legend-item-list'
import { LegendListRef } from '@legendapp/list/react-native'

interface AlbumsProps {
	albumsInfiniteQuery: UseInfiniteQueryResult<(string | number | BaseItemDto)[], Error>
	showAlphabeticalSelector: boolean
	sortBy?: ItemSortBy
	sortDescending?: boolean
	albumPageParams?: RefObject<Set<string>>
}

export default function Albums({
	albumsInfiniteQuery,
	albumPageParams,
	showAlphabeticalSelector,
	sortBy,
	sortDescending,
}: AlbumsProps): React.JSX.Element {
	const theme = useTheme()

	const albums = albumsInfiniteQuery.data ?? []

	const isFavorites = useLibraryStore((state) => state.filters.albums.isFavorites)

	const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>()

	const sectionListRef = useRef<LegendListRef>(null)

	const pendingLetterRef = useRef<string | null>(null)

	const stickyHeaderIndices =
		!showAlphabeticalSelector || !albumsInfiniteQuery.data || sortBy === ItemSortBy.Artist
			? []
			: albumsInfiniteQuery.data
					.map((album, index) => (typeof album === 'string' ? index : null))
					.filter((v): v is number => v !== null)

	const refreshControl = (
		<RefreshControl
			refreshing={albumsInfiniteQuery.isFetching}
			onRefresh={albumsInfiniteQuery.refetch}
			tintColor={theme.primary.val}
		/>
	)

	const keyExtractor = (item: BaseItemDto | string | number) =>
		typeof item === 'string' ? item : typeof item === 'number' ? item.toString() : item.Id!

	// Precompute a stable list-index → object-index map so renderItem can build
	// `album-item-N` testIDs in O(1) instead of slicing/filtering the full list
	// on every row render. React Compiler memoizes this on `albums` identity.
	const objectIndexByListIndex: number[] = []
	{
		let count = 0
		for (let i = 0; i < albums.length; i++) {
			if (typeof albums[i] === 'object') {
				objectIndexByListIndex[i] = count++
			}
		}
	}

	const renderItem = ({
		index,
		item: album,
	}: {
		index: number
		item: BaseItemDto | string | number
	}) => {
		if (typeof album === 'string') {
			return sortBy === ItemSortBy.Artist ? null : (
				<ItemListStickyHeader text={album.toUpperCase()} />
			)
		}
		if (typeof album === 'number') {
			return null
		}
		if (typeof album === 'object') {
			return (
				<ItemRow
					item={album}
					navigation={navigation}
					sortingByReleasedDate={sortBy === ItemSortBy.PremiereDate}
					testID={`album-item-${objectIndexByListIndex[index]}`}
				/>
			)
		}
		return null
	}

	const onEndReached = () => {
		if (albumsInfiniteQuery.hasNextPage) albumsInfiniteQuery.fetchNextPage()
	}

	// Effect for handling the pending alphabet selector letter
	useEffect(() => {
		if (isString(pendingLetterRef.current) && albumsInfiniteQuery.data) {
			const upperLetters = albumsInfiniteQuery.data
				.filter((item): item is string => typeof item === 'string')
				.map((letter) => letter.toUpperCase())
				.sort()

			const index = upperLetters.findIndex((letter) => letter >= pendingLetterRef.current!)

			if (index !== -1) {
				const letterToScroll = upperLetters[index]
				const scrollIndex = albumsInfiniteQuery.data.indexOf(letterToScroll)
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
				const scrollIndex = albumsInfiniteQuery.data.indexOf(lastLetter)
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
	}, [pendingLetterRef.current, albumsInfiniteQuery.data])

	return (
		<XStack flex={1}>
			<LegendItemList
				ref={sectionListRef}
				data={albums}
				renderItem={renderItem}
				ListEmptyComponent={
					<YStack flex={1} justify='center' alignItems='center'>
						<Text marginVertical='auto' color={'$borderColor'}>
							No albums
						</Text>
					</YStack>
				}
				onEndReached={onEndReached}
				refreshControl={refreshControl}
				stickyHeaderIndices={stickyHeaderIndices}
				onScrollBeginDrag={closeAllSwipeableRows}
			/>

			{showAlphabeticalSelector && albumPageParams && (
				<AZScroller reverseOrder={sortDescending} onLetterSelect={async (letter) => {}} />
			)}
		</XStack>
	)
}
