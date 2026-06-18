import { SectionList, SectionListProps, SectionListRef } from '@legendapp/list/section-list'
import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { JSX, RefObject } from 'react'
import { LibrarySectionListData, LibrarySectionListRenderItemInfo } from '../types'
import { Paragraph, useTheme, XStack, YStack } from 'tamagui'
import { RefreshControl } from 'react-native'
import { closeAllSwipeableRows } from './SwipeableRow/registery'
import AZScroller from './AZScroller'
import ListStickyHeader from '../helpers/list-sticky-header'

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

	return (
		<XStack flex={1}>
			<SectionList
				ref={ref}
				contentInsetAdjustmentBehavior='automatic'
				sections={query.data ?? []}
				renderSectionHeader={({ section }) => (
					<ListStickyHeader text={section.title.toUpperCase()} />
				)}
				renderItem={renderItem}
				refreshControl={
					<RefreshControl
						refreshing={query.isFetching}
						onRefresh={query.refetch}
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
						<Paragraph marginVertical='auto' color={'$borderColor'}>
							No tracks
						</Paragraph>
					</YStack>
				}
			/>

			<AZScroller query={query} reverseOrder={sortDescending} sectionListRef={ref} />
		</XStack>
	)
}
