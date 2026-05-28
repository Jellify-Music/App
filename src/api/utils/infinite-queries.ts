import {
	GetNextPageParamFunction,
	GetPreviousPageParamFunction,
	InfiniteData,
} from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { ApiLimits } from '../../configs/query.config'
import { alphabet } from '../../constants/alphabet'
import AlphabeticalPageParam, { AlphabeticalPage } from '../types/page-params'

export const initialAlphabeticalPageParam: AlphabeticalPageParam = {
	page: 0,
	letter: '#',
}

export const getNextAlphabeticalPageParam: GetNextPageParamFunction<
	AlphabeticalPageParam,
	BaseItemDto[]
> = (lastPage, allPages, lastPageParam, allPageParams) => {
	console.debug('getNextAlphabeticalPageParam', lastPageParam, allPageParams)

	let nextPageParam: AlphabeticalPageParam | undefined = undefined

	/**
	 * If the last page was at the Api limit,
	 * increment the numeric page
	 */
	if (lastPage.length === ApiLimits.Library) {
		nextPageParam = {
			...lastPageParam,
			page: lastPageParam.page + 1,
		}
	} else {
		// Calculate next letter
		const nextLetterIndex = alphabet.indexOf(lastPageParam.letter) + 1

		if (nextLetterIndex < alphabet.length) {
			nextPageParam = {
				page: 0,
				letter: alphabet[nextLetterIndex],
			}
		}
	}

	console.debug('nextPageParam', nextPageParam)

	return nextPageParam
}

export const getPreviousAlphabeticalPageParam: GetPreviousPageParamFunction<
	AlphabeticalPageParam,
	BaseItemDto[]
> = (currentPage, allPages, currentPageParam, allPageParams) => {
	console.debug('getPreviousAlphabeticalPageParam', currentPageParam, allPageParams)

	let previousPageParam: AlphabeticalPageParam | undefined = undefined

	/**
	 * If the last page was at the Api limit, decrement unless 0
	 */
	if (currentPageParam.page === 0) {
		// Calculate the previous letter
		const previousLetterIndex = alphabet.indexOf(currentPageParam.letter) - 1

		if (previousLetterIndex >= 0) {
			previousPageParam = {
				page: 0,
				letter: alphabet[previousLetterIndex],
			}
		}
	} else {
		previousPageParam = {
			...currentPageParam,
			page: currentPageParam.page - 1,
		}
	}

	console.debug('previousPageParam', previousPageParam)

	return previousPageParam
}

export function sortifyParams(
	a: AlphabeticalPageParam,
	b: AlphabeticalPageParam,
	sortDescending: boolean,
) {
	const result = a.letter.localeCompare(b.letter)

	if (sortDescending) return -result
	else return result
}

export function sortifyItemArrays(
	a: BaseItemDto[],
	b: BaseItemDto[],
	sortDescending: boolean,
): number {
	const firstItemA = a.length > 0 ? a[0].SortName : undefined
	const firstItemB = b.length > 0 ? b[0].SortName : undefined

	let result: number = 0

	if (firstItemA && firstItemB) {
		result = firstItemA?.localeCompare(firstItemB)
	} else if (firstItemA && !firstItemB) {
		result = 1
	} else if (!firstItemA && firstItemB) {
		result = -1
	}

	return sortDescending ? -result : result
}

export function sortifyPages(a: AlphabeticalPage, b: AlphabeticalPage, sortDescending: boolean) {
	const result = a.title.localeCompare(b.title)

	if (sortDescending) return -result
	else return result
}

export function selectify(
	data: InfiniteData<BaseItemDto[], AlphabeticalPageParam>,
	sortDescending: boolean,
) {
	const pages = data.pages
		.reduce<AlphabeticalPage[]>((sections, page, index) => {
			const letter = data.pageParams[index]?.letter ?? alphabet[0]
			const existingSection = sections.find((section) => section.title === letter)

			if (existingSection) {
				existingSection.data = existingSection.data.concat(page)
			} else {
				sections.push({
					title: letter,
					data: page,
				})
			}

			return sections
		}, [])
		.sort((a, b) => sortifyPages(a, b, sortDescending))

	return {
		...data,
		pages,
	}
}
