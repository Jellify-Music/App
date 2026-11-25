import { getApi, getUser } from '../../../../stores/auth/utils'
import { LibraryApiGetItemsRequest } from '@jellyfin/sdk/lib/generated-client'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api'

export async function getItems(params: LibraryApiGetItemsRequest) {
	const api = getApi()
	const user = getUser()

	if (api) {
		const { data } = await getLibraryApi(api).getItems({
			userId: user?.id,
			enableUserData: true,
			...params,
		})
		return data.Items ?? []
	} else {
		return []
	}
}
