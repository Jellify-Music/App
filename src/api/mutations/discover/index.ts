import { useMutation } from '@tanstack/react-query'
import { useAlbumsOnThisDay, useRecentlyAddedAlbums } from '../../queries/album'
import { usePublicPlaylists } from '../../queries/playlist'
import { useDiscoverArtists } from '../../queries/suggestions'

const useDiscoverQueries = () => {
	const { refetch: refetchRecentlyAdded } = useRecentlyAddedAlbums()

	const { refetch: refetchPublicPlaylists } = usePublicPlaylists()

	const { refetch: refetchArtistSuggestions } = useDiscoverArtists()

	const { refetch: refetchOnThisDay } = useAlbumsOnThisDay()

	return useMutation({
		mutationFn: async () =>
			await Promise.allSettled([
				refetchRecentlyAdded(),
				refetchPublicPlaylists(),
				refetchArtistSuggestions(),
				refetchOnThisDay(),
			]),
		networkMode: 'online',
	})
}

export default useDiscoverQueries
