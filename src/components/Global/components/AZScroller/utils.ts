import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { LibrarySectionListData } from '../../types'

/**
 * Whether the loaded sections already cover the selected letter - either the letter's
 * own section is present, or a section that sorts after it (in the list's sort direction)
 * has been loaded, meaning the letter has no items.
 */
function sectionsCoverLetter(
	sections: LibrarySectionListData[] | undefined,
	selectedLetter: string,
	reverseOrder: boolean,
): boolean {
	if (!sections || sections.length === 0) return false

	return sections.some((section) => {
		const title = section.title.toUpperCase()
		if (title === selectedLetter) return true
		// '#' is the first entry of the scroller in either direction
		if (selectedLetter === '#' || title === '#') return selectedLetter === '#'
		return reverseOrder ? title < selectedLetter : title > selectedLetter
	})
}

/**
 * Paginates the query until the selected letter is loaded (or there are no more pages)
 *
 * Note: the `query` object passed in is a render snapshot - its `data` and `hasNextPage`
 * never change while we're awaiting here, so we read the fresh state from the
 * result `fetchNextPage` resolves with instead.
 *
 * @returns The latest section data after paginating
 */
export default async function onLetterPaginateQuery(
	selectedLetter: string,
	query: UseInfiniteQueryResult<LibrarySectionListData[], Error>,
	reverseOrder: boolean = false,
): Promise<LibrarySectionListData[] | undefined> {
	const letter = selectedLetter.toUpperCase()

	let data = query.data
	let hasNextPage = query.hasNextPage

	while (hasNextPage && !sectionsCoverLetter(data, letter, reverseOrder)) {
		const result = await query.fetchNextPage({ cancelRefetch: false })

		if (result.isError || result.isFetchNextPageError) break

		// Bail if the fetch made no progress, otherwise we could spin forever
		if (result.data === data) break

		data = result.data
		hasNextPage = result.hasNextPage
	}

	return data
}
