import { Api } from '@jellyfin/sdk'
import { useQuery } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { getApi } from '../../../stores'
import { MediaInfoQuery } from './queries'

/**
 * A React hook that will retrieve the latest media info
 * for streaming a given track
 *
 * Depends on the {@link getApi} function for retrieving
 * the currently configured {@link Api}
 * instance
 *
 * @param itemId The Id of the {@link BaseItemDto}
 * @returns
 */
const useStreamedMediaInfo = (itemId: string | null | undefined) => {
	return useQuery(MediaInfoQuery(itemId, 'stream'))
}

export default useStreamedMediaInfo

/**
 * A React hook that will retrieve the latest media info
 * for downloading a given track
 *
 * Depends on the {@link getApi} function for retrieving
 * the currently configured {@link Api}
 * instance
 *
 * @param itemId The Id of the {@link BaseItemDto}
 * @returns
 */
export const useDownloadedMediaInfo = (itemId: string | null | undefined) => {
	return useQuery(MediaInfoQuery(itemId, 'download'))
}
