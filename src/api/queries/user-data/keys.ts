import { QueryKeys } from '../../../enums/query-keys'
import { JellifyUser } from '../../../types/JellifyUser'

const UserDataQueryKey = (user: JellifyUser, itemId: string) => [
	QueryKeys.UserData,
	user.id,
	itemId,
]

export default UserDataQueryKey
