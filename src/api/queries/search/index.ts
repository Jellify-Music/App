import { QueryKeys } from '../../../enums/query-keys'
import { useQuery } from '@tanstack/react-query'
import { fetchSearchResults } from './utils'
import { ONE_MINUTE } from '../../../constants/query-client'
import { useJellifyLibrary } from '../../../stores'

const useSearchResults = (searchString: string | undefined) => {
	const [library] = useJellifyLibrary()

	return useQuery({
		queryKey: [QueryKeys.Search, library?.musicLibraryId, searchString],
		queryFn: () => fetchSearchResults(library?.musicLibraryId, searchString),
		staleTime: ONE_MINUTE * 10, // Cache results for 10 minutes
		gcTime: ONE_MINUTE * 15, // Garbage collect after 15 minutes
		enabled: !!library?.musicLibraryId && !!searchString, // Only run if we have a library ID and a search string
	})
}

export default useSearchResults
