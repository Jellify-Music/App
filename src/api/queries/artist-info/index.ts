import { useQuery } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { QueryAges } from '../../../constants/durations'
import { fetchArtistInfo } from './utils'

/** The artist's info from the Jellyfin server: null once we know it has none */
export const useArtistInfo = (artist: BaseItemDto) =>
	useQuery({
		queryKey: ['ARTIST_INFO', artist.Id],
		queryFn: ({ signal }) => fetchArtistInfo(artist, signal),
		enabled: Boolean(artist.Id),
		staleTime: QueryAges.OneDay,
		gcTime: QueryAges.OneWeek,
	})
