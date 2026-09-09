import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { LibrarySectionListData } from '../../types'

/**
 * Paginates an infinite query so that the section for {@link selectedLetter} becomes available,
 * fetching in whichever direction (next or previous page) is needed to reach it.
 *
 * This allows jumping to a letter that comes "before" data already paginated past (e.g. sections
 * evicted from the sliding `maxPages` window), not just letters further ahead, so the user can
 * keep paginating up or down the alphabet from wherever they last landed.
 *
 * @param selectedLetter The letter selected on the AZScroller
 * @param query The infinite query backing the section list
 * @param reverseOrder Whether the underlying data is sorted Z-A instead of A-Z
 */
export default async function onLetterPaginateQuery(
	selectedLetter: string,
	query: UseInfiniteQueryResult<LibrarySectionListData[], Error>,
	reverseOrder = false,
) {
	const target = selectedLetter.toUpperCase()

	const getTitles = () => (query.data ?? []).map((section) => section.title.toUpperCase())

	/**
	 * True once the target letter has a section loaded, or falls within the range of letters
	 * already loaded (in which case there are simply no items for that exact letter)
	 */
	const isLoaded = () => {
		const titles = getTitles()
		if (titles.length === 0) return false
		if (titles.includes(target)) return true

		const first = titles[0]
		const last = titles[titles.length - 1]
		return reverseOrder ? target <= first && target >= last : target >= first && target <= last
	}

	if (isLoaded()) return

	const titles = getTitles()
	const last = titles[titles.length - 1]

	// Whether the target letter is further along in the fetch direction (needs fetchNextPage)
	// or behind what's currently loaded (needs fetchPreviousPage), e.g. because earlier pages
	// were evicted by the query's sliding maxPages window
	const goForward = titles.length === 0 || (reverseOrder ? target < last : target > last)

	const fetchMore = goForward ? () => query.fetchNextPage() : () => query.fetchPreviousPage()
	const canFetchMore = () => (goForward ? query.hasNextPage : query.hasPreviousPage)

	while (
		!isLoaded() &&
		canFetchMore() &&
		!query.isError &&
		!query.isFetchNextPageError &&
		!query.isFetchPreviousPageError
	) {
		await fetchMore()
	}
}
