import { SectionList, SectionListRef } from '@legendapp/list/section-list'
import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { JSX, RefObject } from 'react'
import { LibrarySectionListData, LibrarySectionListRenderItemInfo } from '../types'
import { Paragraph, useTheme, XStack, YStack } from 'tamagui'
import { RefreshControl } from 'react-native'
import { closeAllSwipeableRows } from './SwipeableRow/registery'
import AZScroller from './AZScroller'
import ListStickyHeader from '../helpers/list-sticky-header'
import { JumpToLetter } from '../../../api/queries/letter-jump'

interface ItemSectionListProps {
	ref: RefObject<SectionListRef | null>
	query: UseInfiniteQueryResult<LibrarySectionListData[], Error>
	renderItem: (info: LibrarySectionListRenderItemInfo) => JSX.Element
	sortDescending: boolean | undefined
	onJumpToLetter?: JumpToLetter
}

export default function ItemSectionList({
	ref,
	query,
	renderItem,
	sortDescending,
	onJumpToLetter,
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
						refreshing={query.isPending || query.isRefetching}
						onRefresh={query.refetch}
						tintColor={theme.primary.val}
					/>
				}
				onStartReached={() => {
					if (query.hasPreviousPage && !query.isFetching) query.fetchPreviousPage()
				}}
				onEndReached={() => {
					if (query.hasNextPage && !query.isFetching) query.fetchNextPage()
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

			{onJumpToLetter && (
				<AZScroller
					sectionListRef={ref}
					query={query}
					onJumpToLetter={onJumpToLetter}
					reverseOrder={sortDescending}
				/>
			)}
		</XStack>
	)
}
