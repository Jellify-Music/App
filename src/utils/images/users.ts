import { getApi } from '@/src/stores'
import { UserDto } from '@jellyfin/sdk/lib/generated-client'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'

export default function getUserImageUrl(user: UserDto): string | undefined {
	const api = getApi()

	if (!api) return undefined

	const imageApi = getImageApi(api)

	return undefined
}
