import React, { RefObject, useRef, useEffect, useMemo, useCallback } from 'react'
import Track from '../Global/components/track'
import { Separator, useTheme, XStack, YStack } from 'tamagui'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { Queue } from '../../player/types/queue-item'
import { FlashList, FlashListRef } from '@shopify/flash-list'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../../screens/types'
import { Text } from '../Global/helpers/text'
import AZScroller, { useAlphabetSelector } from '../Global/components/alphabetical-selector'
import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { isString } from 'lodash'
import { RefreshControl } from 'react-native'
import { closeAllSwipeableRows } from '../Global/components/swipeable-row-registry'
import FlashListStickyHeader from '../Global/helpers/flashlist-sticky-header'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StackActions } from '@react-navigation/native'
import useTrackSelectionStore from '../../stores/selection/tracks'
import SelectionActionBar from '../Global/components/selection-action-bar'

interface TracksProps {
	tracksInfiniteQuery: UseInfiniteQueryResult<(string | number | BaseItemDto)[], Error>
	trackPageParams?: RefObject<Set<string>>
	showAlphabeticalSelector?: boolean
	navigation: Pick<NativeStackNavigationProp<BaseStackParamList>, 'navigate' | 'dispatch'>
	queue: Queue
	selectionContext?: string
}

export default function Tracks({
	tracksInfiniteQuery,
	trackPageParams,
	showAlphabeticalSelector,
	navigation,
	queue,
	selectionContext,
}: TracksProps): React.JSX.Element {
	const theme = useTheme()
	const { bottom } = useSafeAreaInsets()

	const sectionListRef = useRef<FlashListRef<string | number | BaseItemDto>>(null)

	const stickyHeaderIndicies = (() => {
		if (!showAlphabeticalSelector || !tracksInfiniteQuery.data) return []

		return tracksInfiniteQuery.data
			.map((track, index) => (typeof track === 'string' ? index : 0))
			.filter((value, index, indices) => indices.indexOf(value) === index)
	})()

	const { mutateAsync: alphabetSelectorMutate, isPending: isAlphabetSelectorPending } =
		useAlphabetSelector(() => {})

	const tracksToDisplay =
		tracksInfiniteQuery.data?.filter((track) => typeof track === 'object') ?? []

	const selectionContextKey = selectionContext ?? 'tracks'
	const isSelecting = useTrackSelectionStore((state) => state.isSelecting)
	const activeContext = useTrackSelectionStore((state) => state.activeContext)
	const selection = useTrackSelectionStore((state) => state.selection)
	const toggleTrackSelection = useTrackSelectionStore((state) => state.toggleTrack)
	const beginSelection = useTrackSelectionStore((state) => state.beginSelection)
	const endSelection = useTrackSelectionStore((state) => state.endSelection)

	const selectionActive = isSelecting && activeContext === selectionContextKey
	const selectedTracks = useMemo(
		() => (selectionActive ? Object.values(selection) : []),
		[selectionActive, selection],
	)
	const selectedCount = selectedTracks.length

	const contentPaddingBottom = useMemo(() => {
		if (selectionActive && selectedCount > 0) return bottom + 96
		return bottom + 32
	}, [bottom, selectedCount, selectionActive])

	const toggleSelectionForTrack = useCallback(
		(track: BaseItemDto) => {
			if (!selectionActive) beginSelection(selectionContextKey)
			toggleTrackSelection(track)
		},
		[beginSelection, selectionActive, selectionContextKey, toggleTrackSelection],
	)

	const handleAddToPlaylist = useCallback(() => {
		if (!selectedCount) return
		navigation.dispatch(StackActions.push('AddToPlaylist', { tracks: selectedTracks }))
	}, [navigation, selectedCount, selectedTracks])

	const handleLetterSelect = useCallback(
		(letter: string) => {
			if (!trackPageParams) return Promise.resolve()
			return alphabetSelectorMutate({
				letter,
				pageParams: trackPageParams,
				infiniteQuery: tracksInfiniteQuery,
			})
		},
		[alphabetSelectorMutate, trackPageParams, tracksInfiniteQuery],
	)

	useEffect(() => {
		return () => {
			if (selectionActive) endSelection()
		}
	}, [selectionActive, endSelection])

	const keyExtractor = (item: string | number | BaseItemDto) =>
		typeof item === 'object' ? item.Id! : item.toString()

	/**
	 *  Memoize render item to prevent recreation
	 *
	 * We're intentionally ignoring the item index here because
	 * it factors in the list headings, meaning pressing a track may not
	 * play that exact track, since the index was offset by the headings
	 */
	const renderItem = ({
		item: track,
		index,
	}: {
		index: number
		item: string | number | BaseItemDto
	}) =>
		typeof track === 'string' ? (
			<FlashListStickyHeader text={track.toUpperCase()} />
		) : typeof track === 'number' ? null : typeof track === 'object' ? (
			<Track
				navigation={navigation}
				showArtwork
				index={0}
				track={track}
				testID={`track-item-${index}`}
				tracklist={tracksToDisplay.slice(
					tracksToDisplay.indexOf(track),
					tracksToDisplay.indexOf(track) + 50,
				)}
				queue={queue}
				selectionEnabled={selectionActive}
				selected={Boolean(selection[track.Id!])}
				onToggleSelection={() => toggleSelectionForTrack(track)}
				onLongPress={() => toggleSelectionForTrack(track)}
			/>
		) : null

	const ItemSeparatorComponent = ({
		leadingItem,
		trailingItem,
	}: {
		leadingItem: unknown
		trailingItem: unknown
	}) =>
		typeof leadingItem === 'string' || typeof trailingItem === 'string' ? null : <Separator />

	const handleScrollBeginDrag = () => closeAllSwipeableRows()

	return (
		<YStack flex={1} position='relative'>
			<FlashList
				ref={sectionListRef}
				contentInsetAdjustmentBehavior='automatic'
				ItemSeparatorComponent={ItemSeparatorComponent}
				numColumns={1}
				data={tracksInfiniteQuery.data}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
				refreshControl={
					<RefreshControl
						refreshing={tracksInfiniteQuery.isFetching && !isAlphabetSelectorPending}
						onRefresh={tracksInfiniteQuery.refetch}
						tintColor={theme.primary.val}
					/>
				}
				onEndReached={() => {
					if (tracksInfiniteQuery.hasNextPage) tracksInfiniteQuery.fetchNextPage()
				}}
				onScrollBeginDrag={handleScrollBeginDrag}
				stickyHeaderIndices={stickyHeaderIndicies}
				ListEmptyComponent={() => <Text margin={'$6'}>No tracks found.</Text>}
				ListFooterComponent={
					showAlphabeticalSelector ? (
						<AZScroller onLetterSelect={handleLetterSelect} />
					) : undefined
				}
				getItemType={(item) => (typeof item === 'string' ? 'section' : 'row')}
			/>

			{selectionActive && selectedCount > 0 && (
				<SelectionActionBar
					selectedCount={selectedCount}
					onAddToPlaylist={handleAddToPlaylist}
					onClear={endSelection}
					bottomInset={bottom}
				/>
			)}
		</YStack>
	)
}
