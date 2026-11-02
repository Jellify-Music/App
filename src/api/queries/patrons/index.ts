import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '../../../enums/query-keys'
import fetchPatrons from './utils'

const usePatronsQuery = () => {
	return useQuery({
		queryKey: [QueryKeys.Patrons],
		queryFn: ({ signal }) => fetchPatrons(signal),
		select: (patrons) => patrons.sort((a, b) => a.fullName.localeCompare(b.fullName)),
		refetchOnMount: 'always',
		refetchOnWindowFocus: 'always',
	})
}

const usePatrons = () => usePatronsQuery().data

export default usePatrons
