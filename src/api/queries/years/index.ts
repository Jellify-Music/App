import { useQuery } from '@tanstack/react-query'
import { fetchLibraryYears } from './utils'
import { LibraryYearsQueryKey } from './keys'
import { useJellifyLibrary } from '../../../stores/auth'
import { getApi, getUser } from '../../../stores/auth/utils'
import { QueryAges } from '../../../constants/durations'

export function useLibraryYears(): {
	years: number[]
	isPending: boolean
	isError: boolean
} {
	const api = getApi()
	const user = getUser()
	const [library] = useJellifyLibrary()

	const {
		data: years = [],
		isPending,
		isError,
	} = useQuery({
		queryKey: LibraryYearsQueryKey(library?.musicLibraryId, user?.id),
		queryFn: ({ signal }) => fetchLibraryYears(api, library, user?.id, signal),
		enabled: Boolean(api && user?.id),
		staleTime: QueryAges.OneHour * 6,
	})

	return { years, isPending, isError }
}
