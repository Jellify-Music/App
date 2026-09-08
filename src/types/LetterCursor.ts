import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { QueryKey } from '@tanstack/react-query'

/**
 * Lets the A-Z scroller jump straight to the page containing a given letter
 * instead of paginating through every page in between.
 */
export interface LetterCursor {
	/**
	 * The query key of the infinite query this cursor belongs to, so the
	 * fetched page can be merged directly into that query's cache
	 */
	queryKey: QueryKey

	/**
	 * Fetches a single page (respecting the same page size the infinite query
	 * uses) at the given page index
	 */
	fetchPage: (page: number, signal?: AbortSignal) => Promise<BaseItemDto[]>

	/**
	 * Resolves the number of items sorted before the given letter, which is
	 * used to compute which page that letter falls on
	 */
	countBeforeLetter: (letter: string, signal?: AbortSignal) => Promise<number>
}
