import React, { useRef } from 'react'
import ItemRow from '../Global/components/item-row'
import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { SectionListRef } from '@legendapp/list/section-list'
import { LibrarySectionListData, LibrarySectionListRenderItemInfo } from '../Global/types'
import ItemSectionList from '../Global/components/item-section-list'

export interface ArtistsProps {
	artistsInfiniteQuery: UseInfiniteQueryResult<LibrarySectionListData[], Error>
	sortDescending?: boolean
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
	sortDescending,
}: ArtistsProps): React.JSX.Element {
	const artists = artistsInfiniteQuery.data ?? []

	const sectionListRef = useRef<SectionListRef>(null)

	// Precompute a stable list-index → object-index map so renderItem can build
	// `artist-item-N` testIDs in O(1) instead of slicing/filtering the full list
	// on every row render. React Compiler memoizes this on `artists` identity.
	const objectIndexByListIndex: number[] = []
	{
		let count = 0
		for (let i = 0; i < artists.length; i++) {
			if (typeof artists[i] === 'object') {
				objectIndexByListIndex[i] = count++
			}
		}
	}

	const renderItem = ({ index, item: artist }: LibrarySectionListRenderItemInfo) => (
		<ItemRow circular item={artist} testID={`artist-item-${objectIndexByListIndex[index]}`} />
	)

	return (
		<ItemSectionList
			ref={sectionListRef}
			query={artistsInfiniteQuery}
			renderItem={renderItem}
			sortDescending={sortDescending}
		/>
	)
}
