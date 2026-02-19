import React, { useEffect, useRef } from 'react'
import { RefreshControl } from 'react-native'
import { useTheme, XStack, YStack } from 'tamagui'
import { FlashList, FlashListRef } from '@shopify/flash-list'
import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Text } from '../Global/helpers/text'
import Track from '../Global/components/Track'
import ItemRow from '../Global/components/item-row'
import AZScroller from '../Global/components/alphabetical-selector'
import FlashListStickyHeader from '../Global/helpers/flashlist-sticky-header'
import { closeAllSwipeableRows } from '../Global/components/swipeable-row-registry'
import { BaseStackParamList } from '../../screens/types'
import MAX_ITEMS_IN_RECYCLE_POOL from '../../configs/library.config'
import { useLetterAnchoredTracks } from '../../api/queries/track'
import useLibraryCacheValidation from '../../hooks/use-library-cache-validation'
import { Queue } from '../../player/types/queue-item'

interface LetterAnchoredTracksProps {
	queue: Queue
}

/**
 * Letter-anchored Tracks component with instant A-Z navigation.
 */
export default function LetterAnchoredTracks({
	queue,
}: LetterAnchoredTracksProps): React.JSX.Element {
	const theme = useTheme()
	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()

	useLibraryCacheValidation()

	const {
		data: tracksData,
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
	} = useLetterAnchoredTracks()

	const sectionListRef = useRef<FlashListRef<string | BaseItemDto>>(null)
	const pendingScrollRef = useRef<boolean>(false)

	// Filter to just audio tracks for playback
	const tracks = tracksData.filter(
		(item): item is BaseItemDto => typeof item === 'object' && item.Type === BaseItemKind.Audio,
	)

	const stickyHeaderIndices = tracksData
		.map((item, index) => (typeof item === 'string' ? index : -1))
		.filter((index) => index !== -1)

	const keyExtractor = (item: BaseItemDto | string, index: number) =>
		typeof item === 'string' ? `header-${item}` : item.Id!

	const renderItem = ({ index, item }: { index: number; item: BaseItemDto | string }) => {
		if (typeof item === 'string') {
			if (index + 1 >= tracksData.length || typeof tracksData[index + 1] !== 'object') {
				return null
			}
			return <FlashListStickyHeader text={item} />
		}

		if (item.Type === BaseItemKind.Audio) {
			return (
				<Track
					navigation={navigation}
					showArtwork
					index={0}
					track={item}
					testID={`track-item-${index}`}
					tracklist={tracks.slice(tracks.indexOf(item), tracks.indexOf(item) + 50)}
					queue={queue}
				/>
			)
		}

		return <ItemRow navigation={navigation} item={item} />
	}

	useEffect(() => {
		if (pendingScrollRef.current && anchorIndex > 0 && tracksData.length > 0) {
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
	}, [anchorIndex, tracksData.length])

	const handleLetterSelect = async (letter: string) => {
		pendingScrollRef.current = true
		setAnchorLetter(letter === '#' ? null : letter.toUpperCase())

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
				keyExtractor={keyExtractor}
				ListEmptyComponent={
					<YStack flex={1} justify='center' alignItems='center'>
						<Text marginVertical='auto' color={'$borderColor'}>
							No tracks
						</Text>
					</YStack>
				}
				data={tracksData}
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
