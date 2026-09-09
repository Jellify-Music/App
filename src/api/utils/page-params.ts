import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { InfiniteSectionListPageParam } from '../types/page-param'
import { alphabetAtoZ } from '../../components/Global/components/AZScroller'
import { ApiLimits } from '../../configs/querying/index.config'

/**
 * The AZScroller letters in the order pages are traversed for a given sort direction
 * (Z -> A -> # when descending, matching the order the API actually returns items in).
 */
export function getOrderedLetters(reverseOrder: boolean): string[] {
	return reverseOrder ? [...alphabetAtoZ].reverse() : alphabetAtoZ
}

/**
 * Builds the `getNextPageParam`/`getPreviousPageParam` pair for a letter-sectioned infinite
 * query (e.g. albums grouped by AZScroller letter). Each page is scoped to a single letter via
 * `nameStartsWith`/`nameLessThan`, so paging within a letter just increments/decrements `index`,
 * while exhausting a letter advances to the next/previous letter in {@link reverseOrder}.
 *
 * @param reverseOrder Letter traversal direction; should match the query's sort direction so
 * pagination walks letters in the same order the API returns items (Z -> A when descending).
 */
export function createLetterPageParamFns(reverseOrder: boolean) {
	const orderedLetters = getOrderedLetters(reverseOrder)

	function getNextPageParam(
		lastPage: BaseItemDto[],
		allPages: BaseItemDto[][],
		lastPageParam: InfiniteSectionListPageParam,
	): InfiniteSectionListPageParam | undefined {
		// Last page was filled, there may be more albums under this letter
		if (lastPage.length === ApiLimits.Library) {
			return {
				...lastPageParam,
				index: lastPageParam.index + ApiLimits.Library,
			}
		}

		// Last page completed the letter, advance to the next one (if any)
		const letterIndex = orderedLetters.indexOf(lastPageParam.letter)
		if (letterIndex === -1 || letterIndex + 1 >= orderedLetters.length) return undefined

		return {
			letter: orderedLetters[letterIndex + 1],
			index: 0,
		}
	}

	function getPreviousPageParam(
		firstPage: BaseItemDto[],
		allPages: BaseItemDto[][],
		firstPageParam: InfiniteSectionListPageParam,
	): InfiniteSectionListPageParam | undefined {
		// Not at the start of the letter yet, step back within it
		if (firstPageParam.index > 0) {
			return {
				...firstPageParam,
				index: Math.max(0, firstPageParam.index - ApiLimits.Library),
			}
		}

		// Already at the first letter, nothing before it
		const letterIndex = orderedLetters.indexOf(firstPageParam.letter)
		if (letterIndex <= 0) return undefined

		// Step back a letter; a negative index tells fetchAlbums to resolve this to that
		// letter's last page via a count-only lookup, instead of paginating forward through it
		return {
			letter: orderedLetters[letterIndex - 1],
			index: -1,
		}
	}

	return { getNextPageParam, getPreviousPageParam }
}
