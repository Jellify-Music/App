import React from 'react'
import { ScrollView } from 'react-native'
import { SizableText, YStack } from 'tamagui'
import { useArtistContext } from '../../../providers/Artist'
import { useArtistInfo } from '../../../api/queries/artist-info'
import ArtistLinks from '../links'
import ArtistListHeader from '../list-header'
import { useArtistListScroll } from '../scroll'

/**
 * Whether the artist has info to show: a biography, or a MusicBrainz ID to link from. The Info tab
 * is only offered when it does, and while we're still finding out it isn't.
 */
export const useHasArtistInfo = (): boolean => {
	const { artist } = useArtistContext()
	const { data } = useArtistInfo(artist)
	return Boolean(data)
}

/** The artist's biography and genres as the Jellyfin server has them, and links to them elsewhere */
export default function InfoTab(): React.JSX.Element {
	const { artist } = useArtistContext()
	const { data: info } = useArtistInfo(artist)

	const { onScroll, scrollEventThrottle } = useArtistListScroll()

	return (
		<ScrollView
			contentInsetAdjustmentBehavior='automatic'
			testID='artist-info-scroll'
			onScroll={onScroll}
			scrollEventThrottle={scrollEventThrottle}
		>
			<ArtistListHeader />

			<YStack padding='$3' gap='$3'>
				{info && info.genres.length > 0 && (
					<SizableText fontSize={14} color='$neutral'>
						{info.genres.join(', ')}
					</SizableText>
				)}

				{info?.bio && <SizableText>{info.bio}</SizableText>}

				<ArtistLinks musicBrainzId={info?.musicBrainzId} />
			</YStack>
		</ScrollView>
	)
}
