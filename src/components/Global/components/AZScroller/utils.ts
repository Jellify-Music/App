import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { LibrarySectionListData } from '../../types'

export default async function onLetterPaginateQuery(
	selectedLetter: string,
	query: UseInfiniteQueryResult<LibrarySectionListData[], Error>,
) {
	do {
		await query.fetchNextPage()
	} while (
		!query.isFetchNextPageError &&
		!query.isError &&
		query.hasNextPage &&
		query.data?.filter((section) => section.title.localeCompare(selectedLetter) === 0)
			.length === 0
	)
}
