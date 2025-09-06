import { useQuery } from '@tanstack/react-query'
import { useFrequentlyPlayedArtists, useFrequentlyPlayedTracks } from '../frequents'
import { useRecentArtists, useRecentlyPlayedTracks } from '../recents'

const useHomeQueries = () => {
	const { refetch: refetchRecentArtists } = useRecentArtists()

	const { refetch: refetchRecentlyPlayed } = useRecentlyPlayedTracks()

	const { refetch: refetchFrequentArtists } = useFrequentlyPlayedArtists()

	const { refetch: refetchFrequentlyPlayed } = useFrequentlyPlayedTracks()

	return useQuery({
		queryKey: ['Home'],
		queryFn: async () => {
			await Promise.all([refetchRecentlyPlayed(), refetchFrequentlyPlayed()])
			await Promise.all([refetchFrequentArtists(), refetchRecentArtists()])
			return true
		},
	})
}

export default useHomeQueries
