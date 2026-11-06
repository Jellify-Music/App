import { QueryKeys } from '../../../enums/query-keys'
import { JellifyUser } from '../../../types/JellifyUser'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'

const UserDataQueryKey = (user: JellifyUser, itemId: BaseItemDto['Id']) => [
	QueryKeys.UserData,
	user.id,
	itemId,
]

export default UserDataQueryKey
