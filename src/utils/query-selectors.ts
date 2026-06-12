import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import { InfiniteData } from '@tanstack/react-query'
import { isString } from 'lodash'
import { LibrarySectionListData } from '../components/Global/types'

export type FlattenInfiniteQueryPagesOptions = {
	/**
	 * When ItemSortBy.Artist, section letters are derived from the item's artist (AlbumArtist/Artists).
	 * When ItemSortBy.Album, section letters are derived from the item's album name.
	 * Otherwise (Name, SortName, etc.) letters are derived from the item's name/SortName.
	 */
	sortBy?: ItemSortBy
}

export default function flattenInfiniteQueryPages(
	data: InfiniteData<BaseItemDto[], unknown>,
	options?: FlattenInfiniteQueryPagesOptions,
): LibrarySectionListData[] {
	/**
	 * A flattened array of all items derived from the infinite query
	 */
	const flattenedItemPages = data.pages.flatMap((page) => page)

	/**
	 * The final array that will be provided to and rendered by the list component
	 */
	const listItems = new Map<string, BaseItemDto[]>()

	flattenedItemPages.forEach((item: BaseItemDto) => {
		const letter = getSectionLetter(item, options?.sortBy)

		const letterItems = listItems.get(letter)
		if (letterItems) {
			letterItems.push(item)
		} else {
			listItems.set(letter, [item])
		}
	})

	return Array.from(listItems).map(([title, data]) => ({
		title,
		data,
	}))
}

/**
 * The section letter an item is displayed under in an A-Z sectioned list:
 * 'A' through 'Z', or '#' when the relevant name doesn't start with a letter.
 *
 * Letter source mirrors the sectioning above: Artist → artist name,
 * Album → album name; otherwise the item's name (tracks) or SortName.
 */
export function getSectionLetter(item: BaseItemDto, sortBy?: ItemSortBy): string {
	const rawLetter =
		sortBy === ItemSortBy.Artist
			? extractFirstLetterByArtist(item)
			: sortBy === ItemSortBy.Album
				? extractFirstLetterByAlbum(item)
				: extractFirstLetter(item)

	return rawLetter.match(/[A-Z]/) ? rawLetter : '#'
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
