import { SectionList, SectionListRef } from '@legendapp/list/section-list'
import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { JSX, ReactElement, RefObject } from 'react'
import { LibrarySectionListData, LibrarySectionListRenderItemInfo } from '../../types'
import { SizableText, useTheme, View, XStack, YStack } from 'tamagui'
import {
	LayoutChangeEvent,
	NativeScrollEvent,
	NativeSyntheticEvent,
	RefreshControl,
} from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { closeAllSwipeableRows } from '../SwipeableRow/registery'
import AZScroller, { AZ_SCROLLER_CLEARANCE } from '../AZScroller'
import ListStickyHeader from './list-sticky-header'
import { useTranslation } from 'react-i18next'
import { useListChrome } from './chrome'

interface ItemSectionListProps {
	ref: RefObject<SectionListRef | null>
	query: UseInfiniteQueryResult<LibrarySectionListData[], Error>
	renderItem: (info: LibrarySectionListRenderItemInfo) => JSX.Element
	sortDescending: boolean | undefined
	ListHeaderComponent?: ReactElement
}

export default function ItemSectionList({
	ref,
	query,
	renderItem,
	sortDescending,
	ListHeaderComponent,
}: ItemSectionListProps) {
	const { t } = useTranslation()

	const theme = useTheme()

	// a screen drawing over the top of the list (the artist's top bar) says how much it covers
	const { topInset, onScroll: onScrollChrome } = useListChrome()

	/**
	 * With a header, the A-Z scroller floats over the list instead of taking a column beside it, so the
	 * header (an artist's image, say) can run edge to edge. Rows then leave room for it themselves.
	 */
	const scrollerOverlaysList = !!ListHeaderComponent

	// The scroller starts below the header, and takes the whole height once that has scrolled away
	const headerHeight = useSharedValue(0)
	const scrollY = useSharedValue(0)
	const scrollerStyle = useAnimatedStyle(() => ({
		top: Math.max(headerHeight.get() - scrollY.get(), topInset),
	}))

	const onRefresh = () => {
		query.refetch()
	}

	const render = (info: LibrarySectionListRenderItemInfo) => (
		<View marginRight={scrollerOverlaysList ? AZ_SCROLLER_CLEARANCE : undefined}>
			{renderItem(info)}
		</View>
	)

	return (
		<XStack flex={1}>
			<SectionList
				ref={ref}
				sections={query.data ?? []}
				renderSectionHeader={({ section }) => (
					<ListStickyHeader text={section.title.toUpperCase()} />
				)}
				recycleItems
				ListHeaderComponent={
					ListHeaderComponent ? (
						<View
							onLayout={(event: LayoutChangeEvent) =>
								headerHeight.set(event.nativeEvent.layout.height)
							}
						>
							{ListHeaderComponent}
						</View>
					) : undefined
				}
				onScroll={
					scrollerOverlaysList || onScrollChrome
						? (event: NativeSyntheticEvent<NativeScrollEvent>) => {
								scrollY.set(event.nativeEvent.contentOffset.y)
								onScrollChrome?.(event)
							}
						: undefined
				}
				scrollEventThrottle={16}
				stickySectionHeadersEnabled
				stickyHeaderConfig={topInset > 0 ? { offset: topInset } : undefined}
				renderItem={render}
				refreshControl={
					<RefreshControl
						refreshing={query.isFetching}
						onRefresh={onRefresh}
						tintColor={theme.primary.val}
					/>
				}
				onStartReached={() => {
					if (query.hasPreviousPage) query.fetchPreviousPage()
				}}
				onEndReached={() => {
					if (query.hasNextPage) query.fetchNextPage()
				}}
				onScrollBeginDrag={closeAllSwipeableRows}
				ListEmptyComponent={
					<YStack flex={1} justify='center' alignItems='center'>
						<SizableText fontSize='2' marginVertical='auto' color='borderColor'>
							{t('common.noItems')}
						</SizableText>
					</YStack>
				}
			/>

			{scrollerOverlaysList ? (
				<Animated.View
					style={[
						{ position: 'absolute', right: 0, bottom: 0, flexDirection: 'row' },
						scrollerStyle,
					]}
				>
					<AZScroller query={query} reverseOrder={sortDescending} sectionListRef={ref} />
				</Animated.View>
			) : (
				<AZScroller query={query} reverseOrder={sortDescending} sectionListRef={ref} />
			)}
		</XStack>
	)
}
