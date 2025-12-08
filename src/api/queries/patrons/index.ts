import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '../../../enums/query-keys'
import fetchPatrons from './utils'
import { ONE_DAY } from '../../../constants/query-client'
import { useApi } from '../../../stores'

const usePatronsQuery = () => {
	const api = useApi()

	return useQuery({
		queryKey: [QueryKeys.Patrons],
		queryFn: () => fetchPatrons(api),
		select: (patrons) => patrons.sort((a, b) => a.fullName.localeCompare(b.fullName)),
		staleTime: ONE_DAY,
		refetchOnMount: 'always',
		refetchOnWindowFocus: 'always',
	})
}

const usePatrons = () => usePatronsQuery().data

export default usePatrons
