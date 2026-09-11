import { setQueryUserDataForItem } from '../../api/queries/user-data'
import { getApi, getUser } from '../../stores/auth/utils'
import {
	BaseItemDto,
	BaseItemKind,
	ImageType,
	ItemFields,
} from '@jellyfin/sdk/lib/generated-client'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { isEmpty, isUndefined, uniq } from 'lodash'
import { queryClient } from '../../constants/query-client'
import { ArtistQueryKey } from '../../api/queries/artist/keys'

/**
 *
 * @param tracks
 * @param signal
 * @returns
 */
export async function mapTracksToArtists(
	tracks: BaseItemDto[],
	signal?: AbortSignal,
): Promise<BaseItemDto[]> {
	const api = getApi()
	const user = getUser()

	const artistIds = uniq(
		tracks
			.map((track) => track.ArtistItems)
			.filter((artists) => !!artists && artists.length > 0)
			.map((artists) => artists?.[0].Id)
			.filter((Id) => !isUndefined(Id)),
	)

	return await getItemsApi(api!)
		.getItems(
			{
				userId: user?.id,
				includeItemTypes: [BaseItemKind.MusicArtist],
				ids: artistIds,
				fields: [ItemFields.Genres, ItemFields.SortName],
				enableImages: true,
				enableImageTypes: [ImageType.Backdrop, ImageType.Primary],
				imageTypeLimit: 1,
				enableUserData: true,
			},
			{
				signal,
			},
		)
		.then(({ data }) => {
			const fetchedArtists = data.Items ?? []

			fetchedArtists.forEach((artist) => {
				setQueryUserDataForItem(artist)
				queryClient.setQueryData(ArtistQueryKey(artist.Id), artist)
			})

			return fetchedArtists.sort((a, b) => {
				const aIndex = artistIds.findIndex((Id) => a.Id === Id)
				const bIndex = artistIds.findIndex((Id) => b.Id === Id)

				return aIndex - bIndex
			})
		})
}
