import { GetNextPageParamFunction, GetPreviousPageParamFunction } from '@tanstack/react-query'
import AlphabeticalPageParam from '../types/page-params'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { ApiLimits } from '../../configs/query.config'
import { alphabet } from '../../constants/alphabet'

export const getNextAlphabeticalPageParam: GetNextPageParamFunction<
	AlphabeticalPageParam,
	BaseItemDto[]
> = (lastPage, allPages, lastPageParam, allPageParams) => {
	console.debug('getNextAlphabeticalPageParam', lastPage, allPages, lastPageParam, allPageParams)

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
	console.debug(
		'getPreviousAlphabeticalPageParam',
		currentPage,
		allPages,
		currentPageParam,
		allPageParams,
	)

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
