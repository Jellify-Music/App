import { useMutation } from '@tanstack/react-query'
import { useFrequentlyPlayedArtists, useFrequentlyPlayedTracks } from '../frequents'
import { useRecentArtists, useRecentlyPlayedTracks } from '../recents'
import { useUserPlaylists } from '../playlist'

const useHomeQueries = () => {
	const { refetch: refetchUserPlaylists } = useUserPlaylists()

	const { refetch: refetchRecentArtists } = useRecentArtists()

	const { refetch: refetchRecentlyPlayed } = useRecentlyPlayedTracks()

	const { refetch: refetchFrequentArtists } = useFrequentlyPlayedArtists()

	const { refetch: refetchFrequentlyPlayed } = useFrequentlyPlayedTracks()

	return useQuery({
		queryKey: ['Home'],
		queryFn: async () => {
			await Promise.all([
				refetchRecentlyPlayed(),
				refetchFrequentlyPlayed(),
				refetchUserPlaylists(),
			])
			await Promise.all([refetchFrequentArtists(), refetchRecentArtists()])
			return true
		},
	})
}

export default useHomeQueries
