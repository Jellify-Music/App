import React from 'react'
import { Linking } from 'react-native'
import { SizableText, XStack } from 'tamagui'
import { useTranslation } from 'react-i18next'
import {
	ArtistLink,
	ArtistLinkKind,
	musicBrainzArtistUrl,
} from '../../api/queries/artist-info/links'
import { useArtistLinks } from '../../api/queries/artist-info'
import { handleError } from '../../utils/errors'
import { LoggingContext } from '../../utils/logging'
import Icon from '../Global/components/icon'

/** MusicBrainz first, since it is known as soon as the server has said so; the rest come from MusicBrainz */
export function useArtistWebLinks(musicBrainzId: string | undefined): ArtistLink[] {
	const { data: found } = useArtistLinks(musicBrainzId)

	if (!musicBrainzId) return []

	return [{ kind: 'musicbrainz', url: musicBrainzArtistUrl(musicBrainzId) }, ...(found ?? [])]
}

const ICONS = {
	musicbrainz: 'database-search-outline',
	wikipedia: 'wikipedia',
	youtube: 'youtube',
	bandsintown: 'ticket-confirmation-outline',
} as const satisfies Record<ArtistLinkKind, string>

/** Where else to find the artist on the web: opens in the browser */
export default function ArtistLinks({
	musicBrainzId,
}: {
	musicBrainzId: string | undefined
}): React.JSX.Element | null {
	const { t } = useTranslation()

	const links = useArtistWebLinks(musicBrainzId)

	if (links.length === 0) return null

	const labels: Record<ArtistLinkKind, string> = {
		musicbrainz: t('artist.links.musicbrainz'),
		wikipedia: t('artist.links.wikipedia'),
		youtube: t('artist.links.youtube'),
		bandsintown: t('artist.links.bandsintown'),
	}

	return (
		<XStack flexWrap='wrap' gap='$2' testID='artist-links'>
			{links.map(({ kind, url }) => (
				<XStack
					key={kind}
					alignItems='center'
					gap='$2'
					paddingVertical='$2'
					paddingHorizontal='$3'
					borderRadius={999}
					borderWidth={1}
					borderColor='$borderColor'
					role='link'
					aria-label={t('artist.links.open', { name: labels[kind] })}
					testID={`artist-link-${kind}`}
					onPress={() =>
						Linking.openURL(url).catch((error) =>
							handleError(error, LoggingContext.UI, 'openLink'),
						)
					}
				>
					<Icon name={ICONS[kind]} size='6' color='primary' />

					<SizableText fontSize={14}>{labels[kind]}</SizableText>
				</XStack>
			))}
		</XStack>
	)
}
