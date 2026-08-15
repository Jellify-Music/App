import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { getApi, getUser } from '../../../../stores/auth/utils'

export default function getUserImageUrl(): string | undefined {
	const api = getApi()
	if (!api) return undefined

	const user = getUser()
	if (!user) return undefined

	return getImageApi(api).getUserImageUrl(
		{
			Id: user.id,
			Name: user.name,
		},
		{
			maxWidth: 200,
			maxHeight: 200,
			quality: 90,
		},
	)
}
