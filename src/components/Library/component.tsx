import React from 'react'
import { ScrollView } from 'tamagui'
import LibraryNavRow from './components/library-nav-row'

export default function Library(): React.JSX.Element {
	return (
		<ScrollView>
			<LibraryNavRow
				testID='library-nav-artists'
				title='Artists'
				icon='microphone-variant'
				route='LibraryArtists'
				iconColor='$primary'
			/>

			<LibraryNavRow
				testID='library-nav-albums'
				title='Albums'
				icon='disc'
				route='LibraryAlbums'
				iconColor='$primary'
			/>

			<LibraryNavRow
				testID='library-nav-tracks'
				title='Tracks'
				icon='music-note'
				route='LibraryTracks'
				iconColor='$primary'
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
