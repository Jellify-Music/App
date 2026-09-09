import React from 'react'
import { ScrollView } from 'tamagui'
import LibraryNavRow from './components/library-nav-row'
import { useQuery } from '@tanstack/react-query'
import { LibraryQueryKeys } from '../../api/queries/libraries/keys'
import { useJellifyUser } from '../../stores/auth'
import { fetchItemCounts } from '../../api/queries/item'

export default function Library(): React.JSX.Element {
	const [user] = useJellifyUser()

	const { data: itemCounts } = useQuery({
		queryKey: [LibraryQueryKeys.ItemCounts, user?.id],
		queryFn: fetchItemCounts,
	})

	const artistsCount = itemCounts?.ArtistCount
	const albumsCount = itemCounts?.AlbumCount
	const tracksCount = itemCounts?.SongCount

	return (
		<ScrollView>
			<LibraryNavRow
				testID='library-nav-artists'
				title='Artists'
				icon='microphone-variant'
				route='LibraryArtists'
				iconColor='$primary'
				description={
					artistsCount
						? `${artistsCount} artist${artistsCount !== 1 ? 's' : ''}`
						: undefined
				}
			/>

			<LibraryNavRow
				testID='library-nav-albums'
				title='Albums'
				icon='disc'
				route='LibraryAlbums'
				iconColor='$primary'
				description={
					albumsCount ? `${albumsCount} album${albumsCount !== 1 ? 's' : ''}` : undefined
				}
			/>

			<LibraryNavRow
				testID='library-nav-tracks'
				title='Tracks'
				icon='music-note'
				route='LibraryTracks'
				iconColor='$primary'
				description={
					tracksCount ? `${tracksCount} track${tracksCount !== 1 ? 's' : ''}` : undefined
				}
			/>

			<LibraryNavRow
				testID='library-nav-playlists'
				title='Playlists'
				icon='cassette'
				route='Playlists'
				iconColor='$primary'
			/>
		</ScrollView>
	)
}
