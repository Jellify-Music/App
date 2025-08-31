import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { InfiniteData } from '@tanstack/react-query'
import { isString } from 'lodash'
import { RefObject } from 'react'

export default function flattenInfiniteQueryPages(
	data: InfiniteData<BaseItemDto[], unknown>,
	pageParams: RefObject<Set<string>>,
) {
	/**
	 * A flattened array of all artists derived from the infinite query
	 */
	const flattenedItemPages = data.pages.flatMap((page) => page)

	/**
	 * A set of letters we've seen so we can add them to the alphabetical selector
	 */
	const seenLetters = new Set<string>()

	/**
	 * The final array that will be provided to and rendered by the {@link Artists} component
	 */
	const flashListItems: (string | number | BaseItemDto)[] = []

	flattenedItemPages.forEach((item: BaseItemDto) => {
		const rawLetter = isString(item.SortName) ? item.SortName.charAt(0).toUpperCase() : '#'

		/**
		 * An alpha character or a hash if the artist's name doesn't start with a letter
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
