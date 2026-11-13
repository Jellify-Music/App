import { ApiNotAvailableError } from '../../../../types/errors'
import { getApi } from '../../../../stores/auth/utils'
import { getPluginApi } from '@jellyfin/sdk/lib/utils/api'
import { PluginInfo } from '@jellyfin/sdk/lib/generated-client'

/**
 * Fetches the list of installed server plugins
 *
 * @param signal Optional AbortSignal to cancel the request
 * @throws An {@link ApiNotAvailableError} if {@link getApi} returns null or undefined
 * @returns A promise that resolves to an array of PluginInfo objects
 */
export default async function fetchServerPlugins(signal?: AbortSignal): Promise<PluginInfo[]> {
	const api = getApi()

	if (!api) throw new ApiNotAvailableError()

	const { data } = await getPluginApi(api).getPlugins({ signal })

	return data
}
