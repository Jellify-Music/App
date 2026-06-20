import React, { useRef } from 'react'
import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import ItemRow from '../Global/components/item-row'
import { SectionListRef } from '@legendapp/list/section-list'
import { LibrarySectionListData, LibrarySectionListRenderItemInfo } from '../Global/types'
import ItemSectionList from '../Global/components/item-section-list'
import ItemList from '../Global/components/item-list'
import { JumpToLetter } from '../../api/queries/letter-jump'

interface AlbumsProps {
	albumsInfiniteQuery: UseInfiniteQueryResult<(BaseItemDto | LibrarySectionListData)[], Error>
	sortBy?: ItemSortBy
	sortDescending?: boolean
	onJumpToLetter?: JumpToLetter
}

export default function Albums({
	albumsInfiniteQuery,
	sortDescending,
	sortBy,
	onJumpToLetter,
}: AlbumsProps): React.JSX.Element {
	const albums = albumsInfiniteQuery.data ?? []

	const sectionListRef = useRef<SectionListRef>(null)

	// Precompute a stable list-index → object-index map so renderItem can build
	// `album-item-N` testIDs in O(1) instead of slicing/filtering the full list
	// on every row render. React Compiler memoizes this on `albums` identity.
	const objectIndexByListIndex: number[] = []
	{
		let count = 0
		for (let i = 0; i < albums.length; i++) {
			if (typeof albums[i] === 'object') {
				objectIndexByListIndex[i] = count++
			}
		}
	}

	const useSectionList =
		sortBy === ItemSortBy.Name || sortBy === ItemSortBy.SortName || sortBy === ItemSortBy.Album

	const renderItem = ({ item: album, index }: LibrarySectionListRenderItemInfo) => (
		<ItemRow item={album} testID={`album-item-${index}`} />
	)

	return useSectionList ? (
		<ItemSectionList
			ref={sectionListRef}
			renderItem={renderItem}
			query={albumsInfiniteQuery as UseInfiniteQueryResult<LibrarySectionListData[], Error>}
			sortDescending={sortDescending}
			onJumpToLetter={onJumpToLetter}
		/>
	) : (
		<ItemList query={albumsInfiniteQuery as UseInfiniteQueryResult<BaseItemDto[], Error>} />
	)
}
