import { useTheme, XStack, YStack } from 'tamagui'
import React, { RefObject, useEffect, useRef } from 'react'
import { Text } from '../Global/helpers/text'
import { FlashList, FlashListRef } from '@shopify/flash-list'
import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import ItemRow from '../Global/components/item-row'
import { useNavigation } from '@react-navigation/native'
import LibraryStackParamList from '../../screens/Library/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import AZScroller, { useAlphabetSelector } from '../Global/components/alphabetical-selector'
import { isString } from 'lodash'
import FlashListStickyHeader from '../Global/helpers/flashlist-sticky-header'
import { closeAllSwipeableRows } from '../Global/components/swipeable-row-registry'
import useLibraryStore from '../../stores/library'
import { RefreshControl } from 'react-native'
import MAX_ITEMS_IN_RECYCLE_POOL from '../../configs/library.config'

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

	const sectionListRef = useRef<FlashListRef<string | number | BaseItemDto>>(null)

	const pendingLetterRef = useRef<string | null>(null)

	const stickyHeaderIndices =
		!showAlphabeticalSelector || !albumsInfiniteQuery.data || sortBy === ItemSortBy.Artist
			? []
			: albumsInfiniteQuery.data
					.map((album, index) => (typeof album === 'string' ? index : null))
					.filter((v): v is number => v !== null)

	const { mutateAsync: alphabetSelectorMutate, isPending: isAlphabetSelectorPending } =
		useAlphabetSelector((letter) => (pendingLetterRef.current = letter.toUpperCase()))

	const refreshControl = (
		<RefreshControl
			refreshing={albumsInfiniteQuery.isFetching && !isAlphabetSelectorPending}
			onRefresh={albumsInfiniteQuery.refetch}
			tintColor={theme.primary.val}
		/>
	)

	const keyExtractor = (item: BaseItemDto | string | number) =>
		typeof item === 'string' ? item : typeof item === 'number' ? item.toString() : item.Id!

	const renderItem = ({
		index,
		item: album,
	}: {
		index: number
		item: BaseItemDto | string | number
	}) =>
		typeof album === 'string' ? (
			sortBy === ItemSortBy.Artist ? null : (
				<FlashListStickyHeader text={album.toUpperCase()} />
			)
		) : typeof album === 'number' ? null : typeof album === 'object' ? (
			<ItemRow item={album} navigation={navigation} />
		) : null

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
			<FlashList
				ref={sectionListRef}
				extraData={isFavorites}
				data={albums}
				keyExtractor={keyExtractor}
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
				stickyHeaderConfig={{
					// The list likes to flicker without this
					useNativeDriver: false,
				}}
				onScrollBeginDrag={closeAllSwipeableRows}
				removeClippedSubviews
				maxItemsInRecyclePool={MAX_ITEMS_IN_RECYCLE_POOL}
			/>

			{showAlphabeticalSelector && albumPageParams && (
				<AZScroller
					reverseOrder={sortDescending}
					onLetterSelect={(letter) =>
						alphabetSelectorMutate({
							letter,
							infiniteQuery: albumsInfiniteQuery,
							pageParams: albumPageParams,
						})
					}
				/>
			)}
		</XStack>
	)
}
