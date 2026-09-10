import React from 'react'
import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { JumpToLetter } from '../Global/types'
import ItemList from '../Global/components/Item/item-list'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'

export interface ArtistsProps {
	artistsInfiniteQuery: UseInfiniteQueryResult<BaseItemDto[]>
	sortDescending?: boolean
	jumpToLetter?: JumpToLetter
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
	jumpToLetter,
}: ArtistsProps): React.JSX.Element {
	const artists = artistsInfiniteQuery.data ?? []

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

	return <ItemList query={artistsInfiniteQuery} />
}
