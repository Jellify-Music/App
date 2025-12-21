import { useMutation } from '@tanstack/react-query'
import { useRecentlyAddedAlbums } from '../../queries/album'
import { usePublicPlaylists } from '../../queries/playlist'
import { useDiscoverArtists } from '../../queries/suggestions'

const useDiscoverQueries = () => {
	const { refetch: refetchRecentlyAdded } = useRecentlyAddedAlbums()

	const { refetch: refetchPublicPlaylists } = usePublicPlaylists()

	const { refetch: refetchArtistSuggestions } = useDiscoverArtists()

	return useMutation({
		mutationFn: async () =>
			await Promise.allSettled([
				refetchRecentlyAdded(),
				refetchPublicPlaylists(),
				refetchArtistSuggestions(),
			]),
		networkMode: 'online',
	})
}

export default useDiscoverQueries
