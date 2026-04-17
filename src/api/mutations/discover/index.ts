import { useMutation } from '@tanstack/react-query'
import { useRecentlyAddedAlbums } from '../../queries/album'
import { usePublicPlaylists } from '../../queries/playlist'
import { useDiscoverAlbums, useDiscoverArtists } from '../../queries/suggestions'

const useDiscoverQueries = () => {
	const { refetch: refetchRecentlyAdded } = useRecentlyAddedAlbums()

	const { refetch: refetchPublicPlaylists } = usePublicPlaylists()

	const { refetch: refetchArtistSuggestions } = useDiscoverArtists()

	const { refetch: refetchAlbumSuggestions } = useDiscoverAlbums()

	return useMutation({
		mutationFn: async () =>
			await Promise.allSettled([
				refetchRecentlyAdded(),
				refetchPublicPlaylists(),
				refetchArtistSuggestions(),
				refetchAlbumSuggestions(),
			]),
		networkMode: 'online',
	})
}

export default useDiscoverQueries
