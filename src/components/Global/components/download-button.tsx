import React from 'react'
import { Spinner, View, XStack } from 'tamagui'
import { useTranslation } from 'react-i18next'
import { CollectionDownload } from '../../../hooks/downloads/collection'
import { ICON_PRESS_STYLES } from '../../../configs/styling/elements'
import Icon from './icon'
import CircularProgressIndicator from './DownloadIndicator/circular-progress-indicator'

/**
 * Downloads, or stops downloading, or removes the downloads of, a set of tracks that belong
 * together, such as an album or a playlist: the download icon, then a ring showing how far along it
 * is, which stops it when pressed, then the broom to remove it all again.
 */
export default function DownloadButton({
	collection: { state, progress, download, cancel, remove },
}: {
	collection: CollectionDownload
}): React.JSX.Element | null {
	const { t } = useTranslation()

	switch (state) {
		// nothing to offer yet, or nothing to download
		case 'loading':
		case 'empty':
			return null

		case 'ready':
			return (
				<Icon
					color='success'
					name='download-circle-outline'
					onPress={download}
					testID='download-button'
					{...ICON_PRESS_STYLES}
				/>
			)

		// pressing it while it downloads stops the download
		case 'downloading':
			return (
				<XStack
					onPress={cancel}
					role='button'
					aria-label={t('context.stopDownload')}
					testID='stop-download-button'
					hitSlop={8}
					alignItems='center'
					justifyContent='center'
				>
					{progress > 0 && progress < 1 ? (
						<CircularProgressIndicator progress={progress} size={28} strokeWidth={4} />
					) : (
						<Spinner color='$success' />
					)}

					{/* a stop square in the middle of the ring, so it reads as something to press */}
					<View
						position='absolute'
						width={9}
						height={9}
						borderRadius={2}
						backgroundColor='$neutral'
					/>
				</XStack>
			)

		case 'downloaded':
			return (
				<Icon
					color='warning'
					name='broom'
					onPress={remove}
					testID='remove-downloads-button'
					{...ICON_PRESS_STYLES}
				/>
			)
	}
}
