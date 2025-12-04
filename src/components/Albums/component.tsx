import { ActivityIndicator, RefreshControl } from 'react-native'
import { Separator, useTheme, XStack, YStack } from 'tamagui'
import React, { RefObject, useCallback, useEffect, useMemo, useRef } from 'react'
import { Text } from '../Global/helpers/text'
import { FlashList, FlashListRef } from '@shopify/flash-list'
import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import ItemRow from '../Global/components/item-row'
import { useNavigation } from '@react-navigation/native'
import LibraryStackParamList from '../../screens/Library/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import AZScroller, { useAlphabetSelector } from '../Global/components/alphabetical-selector'
import { isString } from 'lodash'
import FlashListStickyHeader from '../Global/helpers/flashlist-sticky-header'
import { useLibrarySortAndFilterContext } from '../../providers/Library'
import { closeAllSwipeableRows } from '../Global/components/swipeable-row-registry'

interface AlbumsProps {
	albumsInfiniteQuery: UseInfiniteQueryResult<(string | number | BaseItemDto)[], Error>
	showAlphabeticalSelector: boolean
	albumPageParams?: RefObject<Set<string>>
}

export default function Albums({
	albumsInfiniteQuery,
	albumPageParams,
	showAlphabeticalSelector,
}: AlbumsProps): React.JSX.Element {
	const theme = useTheme()

	const albums = albumsInfiniteQuery.data ?? []

	const { isFavorites } = useLibrarySortAndFilterContext()

	const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>()

	const sectionListRef = useRef<FlashListRef<string | number | BaseItemDto>>(null)

	const pendingLetterRef = useRef<string | null>(null)

	// Memoize expensive stickyHeaderIndices calculation to prevent unnecessary re-computations
	const stickyHeaderIndices = React.useMemo(() => {
		if (!showAlphabeticalSelector || !albumsInfiniteQuery.data) return []

		return albumsInfiniteQuery.data
			.map((album, index) => (typeof album === 'string' ? index : 0))
			.filter((value, index, indices) => indices.indexOf(value) === index)
	}, [showAlphabeticalSelector, albumsInfiniteQuery.data])

	const { mutateAsync: alphabetSelectorMutate, isPending: isAlphabetSelectorPending } =
		useAlphabetSelector((letter) => (pendingLetterRef.current = letter.toUpperCase()))

	const refreshControl = useMemo(
		() => (
			<RefreshControl
				refreshing={albumsInfiniteQuery.isFetching && !isAlphabetSelectorPending}
				onRefresh={albumsInfiniteQuery.refetch}
				tintColor={theme.primary.val}
			/>
		),
		[albumsInfiniteQuery.isFetching, isAlphabetSelectorPending, albumsInfiniteQuery.refetch],
	)

	const ItemSeparatorComponent = useCallback(
		({ leadingItem, trailingItem }: { leadingItem: unknown; trailingItem: unknown }) =>
			typeof leadingItem === 'string' || typeof trailingItem === 'string' ? null : (
				<Separator />
			),
		[],
	)

	const keyExtractor = useCallback(
		(item: BaseItemDto | string | number) =>
			typeof item === 'string' ? item : typeof item === 'number' ? item.toString() : item.Id!,
		[],
	)

	const renderItem = useCallback(
		({ index, item: album }: { index: number; item: BaseItemDto | string | number }) =>
			typeof album === 'string' ? (
				<FlashListStickyHeader text={album.toUpperCase()} />
			) : typeof album === 'number' ? null : typeof album === 'object' ? (
				<ItemRow item={album} navigation={navigation} />
			) : null,
		[navigation],
	)

	const onEndReached = useCallback(() => {
		if (albumsInfiniteQuery.hasNextPage) albumsInfiniteQuery.fetchNextPage()
	}, [albumsInfiniteQuery.hasNextPage, albumsInfiniteQuery.fetchNextPage])

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
				ItemSeparatorComponent={ItemSeparatorComponent}
				refreshControl={refreshControl}
				stickyHeaderIndices={stickyHeaderIndices}
				onScrollBeginDrag={closeAllSwipeableRows}
				removeClippedSubviews
			/>

			{showAlphabeticalSelector && albumPageParams && (
				<AZScroller
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
