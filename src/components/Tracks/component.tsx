import React, { RefObject, useMemo, useRef, useCallback, useEffect } from 'react'
import Track from '../Global/components/track'
import { getToken, getTokens, Separator, XStack } from 'tamagui'
import { BaseItemDto, UserItemDataDto } from '@jellyfin/sdk/lib/generated-client/models'
import { Queue } from '../../player/types/queue-item'
import { queryClient } from '../../constants/query-client'
import { FlashList, FlashListRef } from '@shopify/flash-list'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../../screens/types'
import { useAllDownloadedTracks } from '../../api/queries/download'
import UserDataQueryKey from '../../api/queries/user-data/keys'
import { useJellifyContext } from '../../providers'
import { Text } from '../Global/helpers/text'
import AZScroller, { useAlphabetSelector } from '../Global/components/alphabetical-selector'
import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { isString } from 'lodash'
import { RefreshControl } from 'react-native-gesture-handler'

interface TracksProps {
	tracksInfiniteQuery: UseInfiniteQueryResult<(string | number | BaseItemDto)[], Error>
	trackPageParams?: RefObject<Set<string>>
	showAlphabeticalSelector?: boolean
	navigation: Pick<NativeStackNavigationProp<BaseStackParamList>, 'navigate' | 'dispatch'>
	queue: Queue
	filterDownloaded?: boolean | undefined
	filterFavorites?: boolean | undefined
}

export default function Tracks({
	tracksInfiniteQuery,
	trackPageParams,
	showAlphabeticalSelector,
	navigation,
	queue,
	filterDownloaded,
	filterFavorites,
}: TracksProps): React.JSX.Element {
	const { user } = useJellifyContext()

	const sectionListRef = useRef<FlashListRef<string | number | BaseItemDto>>(null)

	const pendingLetterRef = useRef<string | null>(null)

	const stickyHeaderIndicies = useMemo(() => {
		if (!showAlphabeticalSelector || !tracksInfiniteQuery.data) return []

		return tracksInfiniteQuery.data
			.map((track, index) => (typeof track === 'string' ? index : 0))
			.filter((value, index, indices) => indices.indexOf(value) === index)
	}, [showAlphabeticalSelector, tracksInfiniteQuery.data])

	const { data: downloadedTracks } = useAllDownloadedTracks()

	const { mutate: alphabetSelectorMutate } = useAlphabetSelector(
		(letter) => (pendingLetterRef.current = letter.toUpperCase()),
	)

	// Memoize the expensive tracks processing to prevent memory leaks
	const tracksToDisplay = React.useMemo(() => {
		if (filterDownloaded) {
			return (
				downloadedTracks
					?.map((downloadedTrack) => downloadedTrack.item)
					.filter((downloadedTrack) => {
						if (filterFavorites) {
							return (
								(
									queryClient.getQueryData(
										UserDataQueryKey(user!, downloadedTrack),
									) as UserItemDataDto | undefined
								)?.IsFavorite ?? false
							)
						}
						return true
					}) ?? []
			)
		}
		return tracksInfiniteQuery.data?.filter((track) => typeof track === 'object') ?? []
	}, [filterDownloaded, downloadedTracks, tracksInfiniteQuery.data, filterFavorites])

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
				<XStack
					padding={'$2'}
					backgroundColor={'$background'}
					borderRadius={'$5'}
					borderWidth={'$1'}
					borderColor={'$primary'}
					margin={'$2'}
				>
					<Text bold color={'$primary'}>
						{track.toUpperCase()}
					</Text>
				</XStack>
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

	return (
		<XStack flex={1}>
			<FlashList
				ref={sectionListRef}
				style={{
					marginRight: getToken('$4'),
				}}
				contentInsetAdjustmentBehavior='automatic'
				contentContainerStyle={{
					paddingTop: getToken('$3'),
				}}
				ItemSeparatorComponent={() => <Separator />}
				numColumns={1}
				data={tracksInfiniteQuery.data}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				refreshControl={
					<RefreshControl
						refreshing={tracksInfiniteQuery.isFetching}
						onRefresh={tracksInfiniteQuery.refetch}
					/>
				}
				onEndReached={() => {
					if (tracksInfiniteQuery.hasNextPage) tracksInfiniteQuery.fetchNextPage()
				}}
				stickyHeaderIndices={stickyHeaderIndicies}
				removeClippedSubviews
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
