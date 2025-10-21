import { QueryKeys } from '../../../enums/query-keys'
import { JellifyUser } from '../../../types/JellifyUser'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'

const UserDataQueryKey = (user: JellifyUser, item: BaseItemDto) => [
	QueryKeys.UserData,
	user.id,
	item.Id,
]

export default UserDataQueryKey
