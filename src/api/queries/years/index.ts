import { useQuery } from '@tanstack/react-query'
import { fetchLibraryYears } from './utils'
import { LibraryYearsQueryKey } from './keys'
import { getApi, getUser, useJellifyLibrary } from '../../../stores'
import { ONE_HOUR } from '../../../constants/query-client'

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
		queryFn: () => fetchLibraryYears(api, library, user?.id),
		enabled: Boolean(api && library && user?.id),
		staleTime: ONE_HOUR * 6,
	})

	return { years, isPending, isError }
}
