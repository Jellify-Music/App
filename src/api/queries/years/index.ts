import { useQuery } from '@tanstack/react-query'
import { fetchLibraryYears } from './utils'
import { LibraryYearsQueryKey } from './keys'
import { getApi, getUser, useJellifyLibrary } from '../../../stores'

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
		staleTime: 5 * 60 * 1000,
	})

	return { years, isPending, isError }
}
