import { ApiNotAvailableError } from '../../../../types/errors'
import { getApi } from '../../../../stores/auth/utils'
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api'

export default async function fetchPublicServerInfo() {
	const api = getApi()

	if (!api) return Promise.reject(new ApiNotAvailableError())

	return await getSystemApi(api)
		.getPublicSystemInfo()
		.then(({ data }) => data)
}
