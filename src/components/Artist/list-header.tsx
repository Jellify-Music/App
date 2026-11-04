import React from 'react'
import { YStack } from 'tamagui'
import ArtistHeader from './header'
import ArtistTabBar from './tab-bar'

/** What every tab's list starts with: the artist, then the tabs */
export default function ArtistListHeader(): React.JSX.Element {
	return (
		<YStack>
			<ArtistHeader />

			<ArtistTabBar />
		</YStack>
	)
}
