import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import { SectionListProps } from '@legendapp/list/section-list'
import { InfiniteData } from '@tanstack/react-query'
import { isString } from 'lodash'
import { RefObject } from 'react'
import AlphabeticalPageParam from '../api/types/page-params'
import { SectionListData } from 'react-native'

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
	pageParams: RefObject<Set<string>>,
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

function extractFirstLetter({ Type, SortName, Name }: BaseItemDto): string {
	let letter = '#'

	if (Type === BaseItemKind.Audio)
		letter = isString(Name) ? Name.trim().charAt(0).toUpperCase() : '#'
	else letter = isString(SortName) ? SortName.charAt(0).toUpperCase() : '#'

	return letter
}

function extractFirstLetterByArtist(item: BaseItemDto): string {
	const raw =
		(isString(item.AlbumArtist) && item.AlbumArtist.trim()) ||
		(item.Artists?.[0] && isString(item.Artists[0]) && item.Artists[0].trim())
	if (!raw) return '#'
	return raw.charAt(0).toUpperCase()
}

function extractFirstLetterByAlbum(item: BaseItemDto): string {
	const raw = isString(item.Album) && item.Album.trim()
	if (!raw) return '#'
	return raw.charAt(0).toUpperCase()
}
