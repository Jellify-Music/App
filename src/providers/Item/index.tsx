import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { createContext, ReactNode, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '../../enums/query-keys'
import { fetchMediaInfo } from '../../api/queries/media'
import { useJellifyContext } from '..'
import { useStreamingQualityContext } from '../Settings'
import { getQualityParams } from '../../utils/mappings'
import { fetchAlbumDiscs, fetchItem } from '../../api/queries/item'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { ItemArtistProvider } from './item-artists'
import { queryClient } from '../../constants/query-client'
import { fetchUserData } from '../../api/queries/favorites'

interface ItemContext {
	item: BaseItemDto
}

const ItemContext = createContext<ItemContext>({
	item: {},
})

interface ItemProviderProps {
	item: BaseItemDto
	children: ReactNode
}

/**
 * Performs a series of {@link useQuery} functions that store additional context
 * around the item being browsed, including
 *
 * - Artist(s)
 * - Album
 * - Track(s)
 *
 * This data is used throughout Jellify as additional {@link useQuery} hooks to
 * tap into this cache
 *
 * @param param0 Object containing the {@link BaseItemDto} and the child {@link ReactNode} to render
 * @returns
 */
export const ItemProvider: ({ item, children }: ItemProviderProps) => React.JSX.Element = ({
	item,
	children,
}) => {
	const { api, user } = useJellifyContext()

	const streamingQuality = useStreamingQualityContext()

	const { Id, Type, AlbumId, ArtistItems, UserData } = item

	const artistIds = ArtistItems?.map(({ Id }) => Id) ?? []

	useEffect(() => {
		// Fail fast if we don't have an Item ID to work with
		if (!Id) return
		/**
		 * Fetch and cache the media sources if this item is a track
		 */
		if (Type === BaseItemKind.Audio)
			queryClient.ensureQueryData({
				queryKey: [QueryKeys.MediaSources, streamingQuality, Id],
				queryFn: () => fetchMediaInfo(api, user, getQualityParams(streamingQuality), Id!),
			})

		/**
		 * ...or store it as a queryable if the item is an artist
		 *
		 * Referenced later in the context sheet
		 */
		if (Type === BaseItemKind.MusicArtist)
			queryClient.setQueryData([QueryKeys.ArtistById, Id], item)

		/**
		 * Fire query for a track's album...
		 *
		 * Referenced later in the context sheet
		 */
		if (!!AlbumId && Type === BaseItemKind.Audio)
			queryClient.ensureQueryData({
				queryKey: [QueryKeys.Album, AlbumId],
				queryFn: () => fetchItem(api, item.AlbumId!),
			})

		/**
		 * ...or store it if it is an album
		 *
		 * Referenced later in the context sheet
		 */
		if (Type === BaseItemKind.MusicAlbum) queryClient.setQueryData([QueryKeys.Album, Id], item)

		/**
		 * Prefetch for an album's tracks
		 *
		 * Referenced later in the context sheet
		 */
		if (Type === BaseItemKind.MusicAlbum)
			queryClient.ensureQueryData({
				queryKey: [QueryKeys.ItemTracks, Id],
				queryFn: () => fetchAlbumDiscs(api, item),
			})

		/**
		 * Prefetch query for a playlist's tracks
		 *
		 * Referenced later in the context sheet
		 */
		if (Type === BaseItemKind.Playlist)
			queryClient.ensureQueryData({
				queryKey: [QueryKeys.ItemTracks, Id],
				queryFn: () =>
					getItemsApi(api!)
						.getItems({ parentId: Id! })
						.then(({ data }) => {
							if (data.Items) return data.Items
							else return []
						}),
			})

		if (UserData) queryClient.setQueryData([QueryKeys.UserData, Id], UserData)
		else
			queryClient.ensureQueryData({
				queryKey: [QueryKeys.UserData, Id],
				queryFn: () => fetchUserData(api, user, Id),
			})
	}, [queryClient, api, user, Id, Type, AlbumId, UserData, item, streamingQuality])

	return (
		<ItemContext.Provider value={{ item }}>
			{artistIds.map((Id) => Id && <ItemArtistProvider artistId={Id} key={Id} />)}
			{children}
		</ItemContext.Provider>
	)
}
