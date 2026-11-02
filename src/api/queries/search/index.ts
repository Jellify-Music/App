import { QueryKeys } from '../../../enums/query-keys'
import { useQuery } from '@tanstack/react-query'
import { fetchSearchResults } from './utils'
import { useJellifyLibrary } from '../../../stores/auth'
import { QueryAges } from '../../../constants/durations'

const useSearchResults = (searchString: string | undefined) => {
	const [library] = useJellifyLibrary()

	return useQuery({
		queryKey: [QueryKeys.Search, library?.musicLibraryId, searchString],
		queryFn: ({ signal }) => fetchSearchResults(library?.musicLibraryId, searchString, signal),
		staleTime: QueryAges.OneHour / 4, // Cache results for 15 minutes
		gcTime: QueryAges.OneHour / 4, // Every search string gets its own entry, so don't keep them around
		enabled: Boolean(library?.musicLibraryId) && Boolean(searchString), // Only run if we have a library ID and a search string
	})
}

export default useSearchResults
