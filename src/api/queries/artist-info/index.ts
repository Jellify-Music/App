import { useQuery } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { QueryAges } from '../../../constants/durations'
import { fetchArtistInfo } from './utils'
import { fetchMusicBrainzLinks } from './links'

/** The artist's info from the Jellyfin server: null once we know it has none to show */
export const useArtistInfo = (artist: BaseItemDto) =>
	useQuery({
		queryKey: ['ARTIST_INFO', artist.Id],
		queryFn: ({ signal }) => fetchArtistInfo(artist, signal),
		enabled: Boolean(artist.Id),
		staleTime: QueryAges.OneDay,
		gcTime: QueryAges.OneWeek,
	})

/** What MusicBrainz links to for the artist: Wikipedia, YouTube and Bandsintown, when it has them */
export const useArtistLinks = (musicBrainzId: string | undefined) =>
	useQuery({
		queryKey: ['ARTIST_LINKS', musicBrainzId],
		queryFn: ({ signal }) => fetchMusicBrainzLinks(musicBrainzId!, signal),
		enabled: Boolean(musicBrainzId),
		staleTime: QueryAges.OneWeek,
		gcTime: QueryAges.OneWeek,
		// MusicBrainz is not ours to hammer, and these links are a nicety
		retry: 1,
	})
