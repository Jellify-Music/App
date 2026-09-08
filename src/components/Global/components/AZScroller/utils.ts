import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import { LibrarySectionListData } from '../../types'
import { LetterCursor } from '../../../../types/LetterCursor'
import { ApiLimits, MaxPages } from '../../../../configs/querying/index.config'
import { queryClient } from '../../../../constants/query-client'

/**
 * Jumps the given infinite query straight to the page containing `selectedLetter`,
 * fetching a single page at the resolved cursor instead of paginating through
 * every page in between.
 */
export default async function onLetterPaginateQuery(
	selectedLetter: string,
	query: UseInfiniteQueryResult<LibrarySectionListData[], Error> & { letterCursor: LetterCursor },
) {
	const letter = selectedLetter.toUpperCase()

	const alreadyLoaded = query.data?.some((section) => section.title === letter)

	// Nothing to do if the letter is already loaded, or there's nothing left to fetch
	if (alreadyLoaded || !query.hasNextPage || query.isError) return

	const { queryKey, fetchPage, countBeforeLetter } = query.letterCursor

	const itemsBeforeLetter = await countBeforeLetter(letter)
	const page = Math.floor(itemsBeforeLetter / ApiLimits.Library)

	const items = await fetchPage(page)

	queryClient.setQueryData<InfiniteData<BaseItemDto[], number>>(queryKey, (old) => {
		if (!old) return old

		const existingIndex = old.pageParams.indexOf(page)

		if (existingIndex !== -1) {
			const pages = [...old.pages]
			pages[existingIndex] = items
			return { ...old, pages }
		}

		// Insert at the position matching this page's place in the overall sequence
		// (not always at the end), so flattened items stay in the server's sort order
		// even when letters are jumped to out of sequence
		const insertAt = old.pageParams.findIndex((existingPage) => existingPage > page)
		const at = insertAt === -1 ? old.pageParams.length : insertAt

		const pages = [...old.pages.slice(0, at), items, ...old.pages.slice(at)]
		const pageParams = [...old.pageParams.slice(0, at), page, ...old.pageParams.slice(at)]

		// Mirror react-query's own maxPages trimming so the jump doesn't grow the cache unbounded,
		// dropping from whichever end is farthest from the page we just inserted
		if (pages.length > MaxPages.Library) {
			if (at > pages.length / 2) {
				pages.shift()
				pageParams.shift()
			} else {
				pages.pop()
				pageParams.pop()
			}
		}

		return { pages, pageParams }
	})
}
