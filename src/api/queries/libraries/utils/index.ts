import { BaseItemDto, CollectionType } from '@jellyfin/sdk/lib/generated-client/models'
import { getUserViewApi } from '@jellyfin/sdk/lib/utils/api'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api'
import { ApiNotAvailableError, UserNotAvailableError } from '../../../../types/errors'
import { captureError, LoggingContext } from '../../../../utils/logging'
import { JellifyUser } from '../../../../types/JellifyUser'
import { Api } from '@jellyfin/sdk'

export async function fetchPlaylistLibrary(
	api?: Api,
	user?: JellifyUser,
	signal?: AbortSignal,
): Promise<BaseItemDto | undefined> {
	if (!api) throw new ApiNotAvailableError()
	if (!user) throw new UserNotAvailableError()

	const response = await getLibraryApi(api)
		.getItems({ userId: user.id }, { signal })
		.catch((error) => {
			// A cancelled request isn't a failure worth reporting
			if (!signal?.aborted)
				captureError(error, LoggingContext.LibraryFetch, 'Failed to fetch playlist library')
			throw error
		})

	return response.data.Items?.find((library) => library.CollectionType == 'playlists')
}

/**
 * Fetches the music libraries the user can access
 *
 * @param api The Jellyfin {@link Api} instance
 * @param user The signed in {@link JellifyUser}
 * @param signal Cancels the request
 * @returns The user's views that are music libraries
 */
export async function fetchMusicLibraries(
	api?: Api,
	user?: JellifyUser,
	signal?: AbortSignal,
): Promise<BaseItemDto[]> {
	if (!api) throw new ApiNotAvailableError()
	if (!user) throw new UserNotAvailableError()

	const response = await getUserViewApi(api)
		.getUserViews({ userId: user.id }, { signal })
		.catch((error) => {
			// A cancelled request isn't a failure worth reporting
			if (!signal?.aborted)
				captureError(error, LoggingContext.LibraryFetch, 'Failed to fetch music libraries')
			throw error
		})

	return (
		response.data.Items?.filter((library) => library.CollectionType == CollectionType.Music) ??
		[]
	)
}
