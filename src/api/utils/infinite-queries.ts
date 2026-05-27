import {
	GetNextPageParamFunction,
	GetPreviousPageParamFunction,
	InfiniteData,
} from '@tanstack/react-query'
import AlphabeticalPageParam, { AlphabeticalPage } from '../types/page-params'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { ApiLimits } from '../../configs/query.config'
import { alphabet } from '../../constants/alphabet'

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

export function sortify(a: AlphabeticalPage, b: AlphabeticalPage, sortDescending: boolean) {
	if (sortDescending) return b.title.localeCompare(a.title)
	else return a.title.localeCompare(b.title)
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
		.sort((a, b) => sortify(a, b, sortDescending))

	return {
		...data,
		pages,
	}
}
