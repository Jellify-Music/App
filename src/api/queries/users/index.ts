import { useQuery } from '@tanstack/react-query'
import { UserQueryKey } from './keys'
import { getApi, getUser } from '../../../stores'
import { getUserApi } from '@jellyfin/sdk/lib/utils/api'

//hook to get users on server
export const useUsers = () => {
	//using a query to call fetchUsers for server (not playlist)
	return useQuery({ queryKey: UserQueryKey, queryFn: fetchUsers })
}

//function to call get user API (jellyfin), no export because it's only used here
const fetchUsers = async () => {
	//use api (only get api when this function is called to get users)
	const api = getApi()

	//get owner of playlist (self)
	const owner = getUser()

	//check set
	if (!api) {
		throw new Error('API Instance not set')
	}

	const usersResponse = await getUserApi(api).getUsers()

	//return users where there isn't a user with owner id in array
	//return users from api
	return usersResponse.data.filter((user) => user.Id != owner?.id)
}
