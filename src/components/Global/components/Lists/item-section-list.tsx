import { SectionList, SectionListRef } from '@legendapp/list/section-list'
import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { JSX, RefObject } from 'react'
import { LibrarySectionListData, LibrarySectionListRenderItemInfo } from '../../types'
import { SizableText, useTheme, View, XStack, YStack } from 'tamagui'
import { RefreshControl } from 'react-native'
import { closeAllSwipeableRows } from '../SwipeableRow/registery'
import AZScroller from '../AZScroller'
import ListStickyHeader from './list-sticky-header'

interface ItemSectionListProps {
	ref: RefObject<SectionListRef | null>
	query: UseInfiniteQueryResult<LibrarySectionListData[], Error>
	renderItem: (info: LibrarySectionListRenderItemInfo) => JSX.Element
	sortDescending: boolean | undefined
}

export default function ItemSectionList({
	ref,
	query,
	renderItem,
	sortDescending,
}: ItemSectionListProps) {
	const theme = useTheme()

	const onRefresh = () => {
		query.refetch()
	}

	const render = (info: LibrarySectionListRenderItemInfo) => (
		<View marginHorizontal='2'>{renderItem(info)}</View>
	)

	return (
		<XStack flex={1}>
			<SectionList
				ref={ref}
				sections={query.data ?? []}
				renderSectionHeader={({ section }) => (
					<ListStickyHeader text={section.title.toUpperCase()} />
				)}
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
							No items
						</SizableText>
					</YStack>
				}
			/>

			<AZScroller query={query} reverseOrder={sortDescending} sectionListRef={ref} />
		</XStack>
	)
}
