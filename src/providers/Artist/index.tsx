import fetchSimilar from '../../api/queries/similar'
import { QueryKeys } from '../../enums/query-keys'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { useQuery } from '@tanstack/react-query'
import { createContext, ReactNode, SetStateAction, useContext, useState } from 'react'
import { SharedValue, useSharedValue } from 'react-native-reanimated'
import { useJellifyContext } from '..'
import { fetchArtistAlbums, fetchArtistFeaturedOn } from '../../api/queries/artist'

interface ArtistContext {
	fetchingAlbums: boolean
	fetchingFeaturedOn: boolean
	fetchingSimilarArtists: boolean
	refresh: () => void
	albums: BaseItemDto[] | undefined
	featuredOn: BaseItemDto[] | undefined
	similarArtists: BaseItemDto[] | undefined
	artist: BaseItemDto
	scroll: SharedValue<number>
}

const ArtistContextInitializer = (artist: BaseItemDto) => {
	const { api, library, user } = useJellifyContext()

	const {
		data: albums,
		refetch: refetchAlbums,
		isPending: fetchingAlbums,
	} = useQuery({
		queryKey: [QueryKeys.ArtistAlbums, library?.musicLibraryId, artist.Id!],
		queryFn: () => fetchArtistAlbums(api, library?.musicLibraryId, artist),
	})

	const {
		data: featuredOn,
		refetch: refetchFeaturedOn,
		isPending: fetchingFeaturedOn,
	} = useQuery({
		queryKey: [QueryKeys.ArtistFeaturedOn, library?.musicLibraryId, artist.Id!],
		queryFn: () => fetchArtistFeaturedOn(api, library?.musicLibraryId, artist),
	})

	const {
		data: similarArtists,
		refetch: refetchRefetchSimilarArtists,
		isPending: fetchingSimilarArtists,
	} = useQuery({
		queryKey: [QueryKeys.SimilarItems, library?.musicLibraryId, artist.Id],
		queryFn: () => fetchSimilar(api, user, library?.musicLibraryId, artist.Id!),
	})

	const refresh = () => {
		refetchAlbums()
		refetchFeaturedOn()
		refetchRefetchSimilarArtists()
	}

	const scroll = useSharedValue(0)
	return {
		artist,
		albums,
		featuredOn,
		similarArtists,
		fetchingAlbums,
		fetchingFeaturedOn,
		fetchingSimilarArtists,
		refresh,
		scroll,
	}
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
	scroll: { value: 0 } as SharedValue<number>,
})

export const ArtistProvider: ({
	artist,
	children,
}: {
	artist: BaseItemDto
	children: ReactNode
}) => React.JSX.Element = ({ artist, children }) => {
	const context = ArtistContextInitializer(artist)

	return <ArtistContext.Provider value={{ ...context }}>{children}</ArtistContext.Provider>
}

export const useArtistContext = () => useContext(ArtistContext)
