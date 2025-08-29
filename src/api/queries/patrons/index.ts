import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '../../../enums/query-keys'
import { useJellifyContext } from '../../../providers'
import fetchPatrons from './utils'
import { ONE_DAY } from '../../../constants/query-client'

const usePatronsQuery = () => {
	const { api } = useJellifyContext()

	return useQuery({
		queryKey: [QueryKeys.Patrons],
		queryFn: () => fetchPatrons(api),
		staleTime: ONE_DAY,
	})
}

const usePatrons = () => usePatronsQuery().data

export default usePatrons
