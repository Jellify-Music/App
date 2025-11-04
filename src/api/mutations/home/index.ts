import { useMutation } from '@tanstack/react-query'
import { useFrequentlyPlayedArtists, useFrequentlyPlayedTracks } from '../../queries/frequents'
import { useRecentArtists, useRecentlyPlayedTracks } from '../../queries/recents'
import { useUserPlaylists } from '../../queries/playlist'

const useHomeQueries = () => {
	const { refetch: refetchUserPlaylists } = useUserPlaylists()

	const { refetch: refetchRecentArtists } = useRecentArtists()

	const { refetch: refetchRecentlyPlayed } = useRecentlyPlayedTracks()

	const { refetch: refetchFrequentArtists } = useFrequentlyPlayedArtists()

	const { refetch: refetchFrequentlyPlayed } = useFrequentlyPlayedTracks()

	return useMutation({
		mutationFn: async () => {
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
