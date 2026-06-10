import React, { useRef } from 'react'
import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import ItemRow from '../Global/components/item-row'
import { SectionListRef } from '@legendapp/list/section-list'
import { LibrarySectionListData, LibrarySectionListRenderItemInfo } from '../Global/types'
import ItemSectionList from '../Global/components/item-section-list'

interface AlbumsProps {
	albumsInfiniteQuery: UseInfiniteQueryResult<(BaseItemDto | LibrarySectionListData)[], Error>
	showAlphabeticalSelector: boolean
	sortBy?: ItemSortBy
	sortDescending?: boolean
}

export default function Albums(props: AlbumsProps): React.JSX.Element {
	const albums = props.albumsInfiniteQuery.data ?? []

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

	return <AlbumsSectionList {...props} />
}

function AlbumsSectionList({ albumsInfiniteQuery, sortDescending }: AlbumsProps) {
	const sectionListRef = useRef<SectionListRef>(null)

	const renderItem = ({ item: album, index }: LibrarySectionListRenderItemInfo) => (
		<ItemRow item={album} testID={`album-item-${index}`} />
	)

	return (
		<ItemSectionList
			ref={sectionListRef}
			renderItem={renderItem}
			query={albumsInfiniteQuery as UseInfiniteQueryResult<LibrarySectionListData[], Error>}
			sortDescending={sortDescending}
		/>
	)
}
