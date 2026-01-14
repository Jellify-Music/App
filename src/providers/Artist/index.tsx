import fetchSimilarArtists from '../../api/queries/suggestions/utils/similar'
import { QueryKeys } from '../../enums/query-keys'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { useQuery } from '@tanstack/react-query'
import { createContext, ReactNode, use } from 'react'
import { isUndefined } from 'lodash'
import { useArtistAlbums, useArtistFeaturedOn } from '../../api/queries/artist'
import { useJellifyLibrary, getApi, getUser } from '../../stores'

interface ArtistContext {
	fetchingAlbums: boolean
	fetchingFeaturedOn: boolean
	fetchingSimilarArtists: boolean
	refresh: () => void
	albums: BaseItemDto[] | undefined
	featuredOn: BaseItemDto[] | undefined
	similarArtists: BaseItemDto[] | undefined
	artist: BaseItemDto
}

const ArtistContext = createContext<ArtistContext>({
	fetchingAlbums: false,
	fetchingFeaturedOn: false,
	fetchingSimilarArtists: false,
	artist: {},
	albums: [],
	featuredOn: [],
	similarArtists: [],
	refresh: () => {},
})

export const ArtistProvider = ({
	artist,
	children,
}: {
	artist: BaseItemDto
	children: ReactNode
}) => {
	const api = getApi()
	const user = getUser()
	const [library] = useJellifyLibrary()

	const {
		data: albums,
		refetch: refetchAlbums,
		isPending: fetchingAlbums,
	} = useArtistAlbums(artist)

	const {
		data: featuredOn,
		refetch: refetchFeaturedOn,
		isPending: fetchingFeaturedOn,
	} = useArtistFeaturedOn(artist)

	const {
		data: similarArtists,
		refetch: refetchSimilar,
		isPending: fetchingSimilarArtists,
	} = useQuery({
		queryKey: [QueryKeys.SimilarItems, library?.musicLibraryId, artist.Id],
		queryFn: () => fetchSimilarArtists(api, user, library?.musicLibraryId, artist.Id!),
		enabled: !isUndefined(artist.Id),
	})

	const refresh = () => {
		refetchAlbums()
		refetchFeaturedOn()
		refetchSimilar()
	}

	const value = {
		artist,
		albums,
		featuredOn,
		similarArtists,
		fetchingAlbums,
		fetchingFeaturedOn,
		fetchingSimilarArtists,
		refresh,
	}

	return <ArtistContext value={value}>{children}</ArtistContext>
}

export const useArtistContext = () => use(ArtistContext)
