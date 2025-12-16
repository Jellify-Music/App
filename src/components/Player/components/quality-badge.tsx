import { Spacer, Square } from 'tamagui'
import { Text } from '../../Global/helpers/text'
import navigationRef from '../../../../navigation'
import { parseBitrateFromTranscodingUrl } from '../../../utils/url-parsers'
import { BaseItemDto, MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client'
import { SourceType } from '../../../types/JellifyTrack'
import { StreamOptions } from '../../../api/core/types'

interface QualityBadgeProps {
	item: BaseItemDto
	mediaSourceInfo?: MediaSourceInfo
	sourceType: SourceType
	/** For Navidrome tracks, stream options contain quality info */
	navidromeStreamOptions?: StreamOptions
}

export default function QualityBadge({
	item,
	mediaSourceInfo,
	sourceType,
	navidromeStreamOptions,
}: QualityBadgeProps): React.JSX.Element {
	// For Jellyfin tracks
	if (mediaSourceInfo) {
		const container = mediaSourceInfo.TranscodingContainer || mediaSourceInfo.Container
		const transcodingUrl = mediaSourceInfo.TranscodingUrl

		const bitrate = transcodingUrl
			? parseBitrateFromTranscodingUrl(transcodingUrl)
			: mediaSourceInfo.Bitrate

		return bitrate && container ? (
			<Square
				enterStyle={{ opacity: 1 }}
				exitStyle={{ opacity: 0 }}
				animation={'bouncy'}
				justifyContent='center'
				backgroundColor={'$primary'}
				paddingVertical={'$0.5'}
				paddingHorizontal={'$2'}
				borderRadius={'$2'}
				pressStyle={{ scale: 0.875 }}
				onPress={() => {
					navigationRef.navigate('AudioSpecs', {
						item,
						streamingMediaSourceInfo:
							sourceType === 'stream' ? mediaSourceInfo : undefined,
						downloadedMediaSourceInfo:
							sourceType === 'download' ? mediaSourceInfo : undefined,
					})
				}}
			>
				<Text bold color={'$background'} textAlign='center' fontVariant={['tabular-nums']}>
					{`${Math.floor(bitrate / 1000)}kbps ${formatContainerName(bitrate, container)}`}
				</Text>
			</Square>
		) : (
			<></>
		)
	}

	// For Navidrome tracks - show stream quality setting
	if (navidromeStreamOptions) {
		const format = navidromeStreamOptions.format ?? 'RAW'
		const bitrate = navidromeStreamOptions.maxBitrate

		const qualityText = bitrate
			? `${bitrate}kbps ${format.toUpperCase()}`
			: format.toUpperCase() === 'RAW'
				? 'Original'
				: format.toUpperCase()

		return (
			<Square
				enterStyle={{ opacity: 1 }}
				exitStyle={{ opacity: 0 }}
				animation={'bouncy'}
				justifyContent='center'
				backgroundColor={'$primary'}
				paddingVertical={'$0.5'}
				paddingHorizontal={'$2'}
				borderRadius={'$2'}
				pressStyle={{ scale: 0.875 }}
				onPress={() => {
					navigationRef.navigate('AudioSpecs', {
						item,
						navidromeStreamOptions,
					})
				}}
			>
				<Text bold color={'$background'} textAlign='center' fontVariant={['tabular-nums']}>
					{qualityText}
				</Text>
			</Square>
		)
	}

	return <></>
}

function formatContainerName(bitrate: number, container: string): string {
	let formattedContainer = container.toUpperCase()

	if (formattedContainer.includes('MOV')) {
		if (bitrate > 256) formattedContainer = 'ALAC'
		else formattedContainer = 'AAC'
	}

	return formattedContainer
}
