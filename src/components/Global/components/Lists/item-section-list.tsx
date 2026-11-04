import { SectionList, SectionListRef } from '@legendapp/list/section-list'
import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { JSX, ReactElement, RefObject } from 'react'
import { LibrarySectionListData, LibrarySectionListRenderItemInfo } from '../../types'
import { SizableText, useTheme, View, XStack, YStack } from 'tamagui'
import { RefreshControl } from 'react-native'
import { closeAllSwipeableRows } from '../SwipeableRow/registery'
import AZScroller, { AZ_SCROLLER_CLEARANCE } from '../AZScroller'
import ListStickyHeader from './list-sticky-header'
import { useTranslation } from 'react-i18next'

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

	/**
	 * With a header, the A-Z scroller floats over the list instead of taking a column beside it, so the
	 * header (an artist's image, say) can run edge to edge. Rows then leave room for it themselves.
	 */
	const scrollerOverlaysList = !!ListHeaderComponent

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
				ListHeaderComponent={ListHeaderComponent}
				stickySectionHeadersEnabled
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

			<XStack
				position={scrollerOverlaysList ? 'absolute' : 'relative'}
				right={0}
				top={0}
				bottom={0}
			>
				<AZScroller query={query} reverseOrder={sortDescending} sectionListRef={ref} />
			</XStack>
		</XStack>
	)
}
