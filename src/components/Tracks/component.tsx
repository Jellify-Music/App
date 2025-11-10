import React, { RefObject, useMemo, useRef, useCallback, useEffect } from 'react'
import Track from '../Global/components/track'
import { getToken, Separator, useTheme, XStack, YStack } from 'tamagui'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { Queue } from '../../player/types/queue-item'
import { FlashList, FlashListRef, ViewToken } from '@shopify/flash-list'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../../screens/types'
import { Text } from '../Global/helpers/text'
import AZScroller, { useAlphabetSelector } from '../Global/components/alphabetical-selector'
import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { debounce, isString } from 'lodash'
import { RefreshControl } from 'react-native-gesture-handler'
import useItemContext from '../../hooks/use-item-context'
import { closeAllSwipeableRows } from '../Global/components/swipeable-row-registry'
import FlashListStickyHeader from '../Global/helpers/flashlist-sticky-header'

interface TracksProps {
	tracksInfiniteQuery: UseInfiniteQueryResult<(string | number | BaseItemDto)[], Error>
	trackPageParams?: RefObject<Set<string>>
	showAlphabeticalSelector?: boolean
	navigation: Pick<NativeStackNavigationProp<BaseStackParamList>, 'navigate' | 'dispatch'>
	queue: Queue
}

export default function Tracks({
	tracksInfiniteQuery,
	trackPageParams,
	showAlphabeticalSelector,
	navigation,
	queue,
}: TracksProps): React.JSX.Element {
	const theme = useTheme()

	const warmContext = useItemContext()

	const sectionListRef = useRef<FlashListRef<string | number | BaseItemDto>>(null)

	const pendingLetterRef = useRef<string | null>(null)

	const stickyHeaderIndicies = useMemo(() => {
		if (!showAlphabeticalSelector || !tracksInfiniteQuery.data) return []

		return tracksInfiniteQuery.data
			.map((track, index) => (typeof track === 'string' ? index : 0))
			.filter((value, index, indices) => indices.indexOf(value) === index)
	}, [showAlphabeticalSelector, tracksInfiniteQuery.data])

	const { mutate: alphabetSelectorMutate } = useAlphabetSelector(
		(letter) => (pendingLetterRef.current = letter.toUpperCase()),
	)

	// Memoize the expensive tracks processing to prevent memory leaks
	const tracksToDisplay = React.useMemo(
		() => tracksInfiniteQuery.data?.filter((track) => typeof track === 'object') ?? [],
		[tracksInfiniteQuery.data],
	)

	// Memoize key extraction for FlashList performance
	const keyExtractor = React.useCallback(
		(item: string | number | BaseItemDto) =>
			typeof item === 'object' ? item.Id! : item.toString(),
		[],
	)

	/**
	 *  Memoize render item to prevent recreation
	 *
	 * We're intentionally ignoring the item index here because
	 * it factors in the list headings, meaning pressing a track may not
	 * play that exact track, since the index was offset by the headings
	 */
	const renderItem = useCallback(
		({ item: track }: { index: number; item: string | number | BaseItemDto }) =>
			typeof track === 'string' ? (
				<FlashListStickyHeader text={track.toUpperCase()} />
			) : typeof track === 'number' ? null : typeof track === 'object' ? (
				<Track
					navigation={navigation}
					showArtwork
					index={0}
					track={track}
					tracklist={tracksToDisplay.slice(
						tracksToDisplay.indexOf(track),
						tracksToDisplay.indexOf(track) + 50,
					)}
					queue={queue}
				/>
			) : null,
		[tracksToDisplay, queue],
	)

	const ItemSeparatorComponent = useCallback(
		({ leadingItem, trailingItem }: { leadingItem: unknown; trailingItem: unknown }) =>
			typeof leadingItem === 'string' || typeof trailingItem === 'string' ? null : (
				<Separator />
			),
		[],
	)

	// Effect for handling the pending alphabet selector letter
	useEffect(() => {
		if (isString(pendingLetterRef.current) && tracksInfiniteQuery.data) {
			const upperLetters = tracksInfiniteQuery.data
				.filter((item): item is string => typeof item === 'string')
				.map((letter) => letter.toUpperCase())
				.sort()

			const index = upperLetters.findIndex((letter) => letter >= pendingLetterRef.current!)

			if (index !== -1) {
				const letterToScroll = upperLetters[index]
				const scrollIndex = tracksInfiniteQuery.data.indexOf(letterToScroll)
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
				const scrollIndex = tracksInfiniteQuery.data.indexOf(lastLetter)
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
	}, [pendingLetterRef.current, tracksInfiniteQuery.data])

	const handleScrollBeginDrag = useCallback(() => {
		closeAllSwipeableRows()
	}, [])

	return (
		<XStack flex={1}>
			<FlashList
				ref={sectionListRef}
				contentInsetAdjustmentBehavior='automatic'
				ItemSeparatorComponent={ItemSeparatorComponent}
				numColumns={1}
				data={tracksInfiniteQuery.data}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				refreshControl={
					<RefreshControl
						refreshing={tracksInfiniteQuery.isFetching}
						onRefresh={tracksInfiniteQuery.refetch}
						tintColor={theme.primary.val}
					/>
				}
				onEndReached={() => {
					if (tracksInfiniteQuery.hasNextPage) tracksInfiniteQuery.fetchNextPage()
				}}
				onScrollBeginDrag={handleScrollBeginDrag}
				stickyHeaderIndices={stickyHeaderIndicies}
				ListEmptyComponent={
					<YStack flex={1} justify='center' alignItems='center'>
						<Text marginVertical='auto' color={'$borderColor'}>
							No tracks
						</Text>
					</YStack>
				}
			/>

			{showAlphabeticalSelector && trackPageParams && (
				<AZScroller
					onLetterSelect={(letter) =>
						alphabetSelectorMutate({
							letter,
							infiniteQuery: tracksInfiniteQuery,
							pageParams: trackPageParams,
						})
					}
				/>
			)}
		</XStack>
	)
}
