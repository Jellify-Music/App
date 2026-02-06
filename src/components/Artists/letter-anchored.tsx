import React, { useEffect, useRef } from 'react'
import { RefreshControl } from 'react-native'
import { useTheme, XStack, YStack } from 'tamagui'
import { FlashList, FlashListRef } from '@shopify/flash-list'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Text } from '../Global/helpers/text'
import ItemRow from '../Global/components/item-row'
import AZScroller from '../Global/components/alphabetical-selector'
import FlashListStickyHeader from '../Global/helpers/flashlist-sticky-header'
import { closeAllSwipeableRows } from '../Global/components/swipeable-row-registry'
import LibraryStackParamList from '../../screens/Library/types'
import useLibraryStore from '../../stores/library'
import MAX_ITEMS_IN_RECYCLE_POOL from '../../configs/library.config'
import { useLetterAnchoredArtists } from '../../api/queries/artist'
import useLibraryCacheValidation from '../../hooks/use-library-cache-validation'

/**
 * Letter-anchored Artists component with instant A-Z navigation.
 * Uses bidirectional queries for smooth scrolling in both directions.
 */
export default function LetterAnchoredArtists(): React.JSX.Element {
	const theme = useTheme()
	const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>()
	const isFavorites = useLibraryStore((state) => state.filters.artists.isFavorites)

	// Enable cache validation on app focus
	useLibraryCacheValidation()

	const {
		data: artists,
		letters,
		anchorLetter,
		setAnchorLetter,
		fetchNextPage,
		hasNextPage,
		fetchPreviousPage,
		hasPreviousPage,
		isFetching,
		isPending,
		refetch,
		anchorIndex,
	} = useLetterAnchoredArtists()

	const sectionListRef = useRef<FlashListRef<string | BaseItemDto>>(null)
	const pendingScrollRef = useRef<boolean>(false)

	// Calculate sticky header indices (positions of letter headers)
	const stickyHeaderIndices = artists
		.map((item, index) => (typeof item === 'string' ? index : -1))
		.filter((index) => index !== -1)

	const keyExtractor = (item: BaseItemDto | string, index: number) =>
		typeof item === 'string' ? `header-${item}` : item.Id!

	const renderItem = ({ index, item }: { index: number; item: BaseItemDto | string }) => {
		if (typeof item === 'string') {
			// Don't render empty letter headers
			if (index + 1 >= artists.length || typeof artists[index + 1] !== 'object') {
				return null
			}
			return <FlashListStickyHeader text={item} />
		}
		return <ItemRow circular item={item} navigation={navigation} />
	}

	// Scroll to anchor position when anchor changes
	useEffect(() => {
		if (pendingScrollRef.current && anchorIndex > 0 && artists.length > 0) {
			// Small delay to let FlashList update
			const timer = setTimeout(() => {
				sectionListRef.current?.scrollToIndex({
					index: anchorIndex,
					viewPosition: 0.1,
					animated: true,
				})
				pendingScrollRef.current = false
			}, 100)
			return () => clearTimeout(timer)
		}
	}, [anchorIndex, artists.length])

	const handleLetterSelect = async (letter: string) => {
		pendingScrollRef.current = true
		setAnchorLetter(letter === '#' ? null : letter.toUpperCase())

		// If selecting # or A (start of list), scroll to top
		if (letter === '#' || letter.toUpperCase() === 'A') {
			pendingScrollRef.current = false
			sectionListRef.current?.scrollToIndex({
				index: 0,
				viewPosition: 0,
				animated: true,
			})
		}
	}

	return (
		<XStack flex={1}>
			<FlashList
				contentInsetAdjustmentBehavior='automatic'
				ref={sectionListRef}
				extraData={isFavorites}
				keyExtractor={keyExtractor}
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
						refreshing={isPending}
						onRefresh={refetch}
						tintColor={theme.primary.val}
					/>
				}
				renderItem={renderItem}
				stickyHeaderIndices={stickyHeaderIndices}
				stickyHeaderConfig={{
					useNativeDriver: false,
				}}
				onStartReached={() => {
					if (hasPreviousPage && !isFetching) {
						fetchPreviousPage()
					}
				}}
				onEndReached={() => {
					if (hasNextPage && !isFetching) {
						fetchNextPage()
					}
				}}
				onScrollBeginDrag={closeAllSwipeableRows}
				removeClippedSubviews
				maxItemsInRecyclePool={MAX_ITEMS_IN_RECYCLE_POOL}
			/>

			<AZScroller onLetterSelect={handleLetterSelect} />
		</XStack>
	)
}
