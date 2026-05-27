import React, { JSX, useEffect, useRef } from 'react'
import { useTheme, XStack, YStack } from 'tamagui'
import { Text } from '../Global/helpers/text'
import ItemRow from '../Global/components/item-row'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import AZScroller from '../Global/components/alphabetical-selector'
import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { isEmpty } from 'lodash'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import LibraryStackParamList from '../../screens/Library/types'
import ItemListStickyHeader from '../Global/helpers/item-list-sticky-header'
import { closeAllSwipeableRows } from '../Global/components/SwipeableRow/registery'
import { RefreshControl, SectionListRenderItemInfo } from 'react-native'
import { SectionList, SectionListRef } from '@legendapp/list/section-list'
import AlphabeticalPageParam from '../../api/types/page-params'
import useArtistLibraryStore from '../../stores/library/artist'

export interface ArtistsProps {
	artistsInfiniteQuery: UseInfiniteQueryResult<
		| BaseItemDto[]
		| {
				pages: {
					title: string
					data: BaseItemDto[]
				}[]
				pageParams: AlphabeticalPageParam[]
		  },
		Error
	>
	showAlphabeticalSelector: boolean
	sortDescending?: boolean
	onLetterSelect?: (letter: string) => Promise<void>
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
	onLetterSelect,
}: ArtistsProps): React.JSX.Element {
	const theme = useTheme()

	const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>()

	const artists = artistsInfiniteQuery.data
	const sectionListRef = useRef<SectionListRef>(null)

	const { pendingLetter } = useArtistLibraryStore()

	const sections = Array.isArray(artists)
		? [{ title: '', data: artists }]
		: (artists?.pages ?? [])

	const pageParams = Array.isArray(artists) ? undefined : artists?.pageParams

	const renderItem: (
		info: SectionListRenderItemInfo<
			BaseItemDto,
			{
				title: string
				data: BaseItemDto[]
			}
		>,
	) => JSX.Element = ({ item, index }) => (
		<ItemRow circular item={item} navigation={navigation} testID={`artist-item-${index}`} />
	)

	const handleLetterSelect = async (letter: string) => {
		if (onLetterSelect) await onLetterSelect(letter)
	}

	// Effect for handling the pending alphabet selector letter
	useEffect(() => {
		if (!isEmpty(pendingLetter.letter) && pageParams) {
			const upperLetters = pageParams.map(({ letter }) => letter.toUpperCase())

			const index = upperLetters.findIndex((letter) => letter >= pendingLetter.letter)

			if (index !== -1) {
				const letterToScroll = upperLetters[index]
				const sectionScrollIndex = sections.findIndex(
					({ title }) => title.toUpperCase() === letterToScroll,
				)

				if (sectionScrollIndex !== -1) {
					sectionListRef.current?.scrollToLocation({
						sectionIndex: sectionScrollIndex,
						itemIndex: 0,
						viewPosition: 0.1,
						animated: true,
					})
				}
			} else {
				// fallback: scroll to last section
				const lastLetter = upperLetters[upperLetters.length - 1]
				const sectionScrollIndex = sections.findIndex(
					({ title }) => title.toUpperCase() === lastLetter,
				)
				if (sectionScrollIndex !== -1) {
					sectionListRef.current?.scrollToLocation({
						sectionIndex: sectionScrollIndex,
						itemIndex: 0,
						viewPosition: 0.1,
						animated: true,
					})
				}
			}
		}
	}, [pendingLetter, artists])

	return (
		<XStack flex={1}>
			<SectionList
				contentInsetAdjustmentBehavior='automatic'
				ref={sectionListRef}
				ListEmptyComponent={
					<YStack flex={1} justify='center' alignItems='center'>
						<Text marginVertical='auto' color={'$borderColor'}>
							No artists
						</Text>
					</YStack>
				}
				sections={sections}
				refreshControl={
					<RefreshControl
						refreshing={artistsInfiniteQuery.isPending}
						onRefresh={artistsInfiniteQuery.refetch}
						tintColor={theme.primary.val}
					/>
				}
				renderItem={renderItem}
				stickySectionHeadersEnabled
				renderSectionHeader={({ section }) => <ItemListStickyHeader text={section.title} />}
				onStartReached={() => {
					if (artistsInfiniteQuery.hasPreviousPage)
						artistsInfiniteQuery.fetchPreviousPage()
				}}
				onEndReached={() => {
					if (artistsInfiniteQuery.hasNextPage && !artistsInfiniteQuery.isFetching)
						artistsInfiniteQuery.fetchNextPage()
				}}
				onScrollBeginDrag={closeAllSwipeableRows}
				estimatedItemSize={100}
			/>

			{showAlphabeticalSelector && (
				<AZScroller reverseOrder={sortDescending} onLetterSelect={handleLetterSelect} />
			)}
		</XStack>
	)
}
