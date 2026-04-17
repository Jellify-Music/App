import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import { InfiniteData } from '@tanstack/react-query'
import { isString } from 'lodash'
import { RefObject } from 'react'

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
	pageParams: RefObject<Set<string>>,
	options?: FlattenInfiniteQueryPagesOptions,
) {
	/**
	 * A flattened array of all items derived from the infinite query
	 */
	const flattenedItemPages = data.pages.flatMap((page) => page)

	/**
	 * A set of letters we've seen so we can add them to the alphabetical selector
	 */
	const seenLetters = new Set<string>()

	/**
	 * The final array that will be provided to and rendered by the list component
	 */
	const flashListItems: (string | number | BaseItemDto)[] = []

	// Letter source: Artist → artist; Album → album name; otherwise → item name (track name, etc.)
	const extractLetter =
		options?.sortBy === ItemSortBy.Artist
			? extractFirstLetterByArtist
			: options?.sortBy === ItemSortBy.Album
				? extractFirstLetterByAlbum
				: extractFirstLetter

	flattenedItemPages.forEach((item: BaseItemDto) => {
		const rawLetter = extractLetter(item)

		/**
		 * An alpha character or a hash if the name doesn't start with a letter
		 */
		const letter = rawLetter.match(/[A-Z]/) ? rawLetter : '#'

		if (!seenLetters.has(letter)) {
			seenLetters.add(letter.toUpperCase())
			flashListItems.push(letter.toUpperCase())
		}

		flashListItems.push(item)
	})

	pageParams.current = seenLetters

	return flashListItems
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
