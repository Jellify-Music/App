import React from 'react'
import { Spinner, XStack } from 'tamagui'
import { useTranslation } from 'react-i18next'
import { ArtistDownload } from '../../hooks/downloads/artist'
import Icon from '../Global/components/icon'
import CircularProgressIndicator from '../Global/components/DownloadIndicator/circular-progress-indicator'

/**
 * Downloads everything by the artist, with the same states as the album and playlist screens'
 * button: download, how far along it is, and the broom to remove it all again.
 */
export default function ArtistDownloadButton({
	download: { state, progress, startDownload, removeAll },
	onShowProgress,
}: {
	download: ArtistDownload
	/** Tapping the progress shows which albums are downloading */
	onShowProgress: () => void
}): React.JSX.Element | null {
	const { t } = useTranslation()

	switch (state) {
		// nothing to download, so nothing to offer
		case 'empty':
			return null

		case 'loading':
			return <Spinner color='neutral' />

		case 'downloading':
			return (
				<XStack
					onPress={onShowProgress}
					role='button'
					aria-label={t('artist.download.showProgress')}
					testID='artist-download-progress-button'
					hitSlop={8}
				>
					{progress > 0 && progress < 1 ? (
						<CircularProgressIndicator progress={progress} size={28} strokeWidth={4} />
					) : (
						<Spinner color='neutral' />
					)}
				</XStack>
			)

		case 'downloaded':
			return (
				<Icon
					name='broom'
					size='7'
					color='warning'
					onPress={removeAll}
					testID='artist-remove-downloads-button'
					accessibilityLabel={t('artist.download.removeAll')}
				/>
			)

		case 'ready':
			return (
				<Icon
					name='download-circle-outline'
					size='7'
					color='success'
					onPress={startDownload}
					testID='artist-download-all-button'
					accessibilityLabel={t('artist.download.downloadAll')}
				/>
			)
	}
}
