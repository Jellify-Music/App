import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import { InfiniteData } from '@tanstack/react-query'
import { isString } from 'lodash'
import AlphabeticalPageParam from '../api/types/page-params'

export type FlattenInfiniteQueryPagesOptions = {
	/**
	 * When ItemSortBy.Artist, section letters are derived from the item's artist (AlbumArtist/Artists).
	 * When ItemSortBy.Album, section letters are derived from the item's album name.
	 * Otherwise (Name, SortName, etc.) letters are derived from the item's name/SortName.
	 */
	sortBy?: ItemSortBy
}

export default function flattenInfiniteQueryPages(
	data: InfiniteData<BaseItemDto[], AlphabeticalPageParam>,
	options?: FlattenInfiniteQueryPagesOptions,
): { title: string; data: BaseItemDto[] }[] {
	/**
	 * A flattened array of all items derived from the infinite query
	 */
	const flattenedItemPages = data.pageParams.map(({ letter }, index, pageParams) => {
		return {
			title: letter,
			data: data.pages[index],
		}
	})

	return flattenedItemPages
}
