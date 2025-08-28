import { Square } from 'tamagui'
import { Text } from '../../Global/helpers/text'
import navigationRef from '../../../../navigation'
import { parseBitrateFromTranscodingUrl } from '../../../utils/url-parsers'
import { BaseItemDto, MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client'
import { SourceType } from '../../../types/JellifyTrack'

interface QualityBadgeProps {
	item: BaseItemDto
	mediaSourceInfo: MediaSourceInfo
	sourceType: SourceType
}

export default function QualityBadge({
	item,
	mediaSourceInfo,
	sourceType,
}: QualityBadgeProps): React.JSX.Element {
	const container = mediaSourceInfo.TranscodingContainer || mediaSourceInfo.Container
	const transcodingUrl = mediaSourceInfo.TranscodingUrl

	const bitrate = transcodingUrl
		? parseBitrateFromTranscodingUrl(transcodingUrl)
		: mediaSourceInfo.Bitrate

	return bitrate && container ? (
		<Square
			animation={'bouncy'}
			justifyContent='center'
			borderWidth={'$1'}
			backgroundColor={'$primary'}
			paddingHorizontal={'$1'}
			borderRadius={'$2'}
			pressStyle={{ scale: 0.875 }}
			onPress={() => {
				navigationRef.navigate('AudioSpecs', {
					item,
					streamingMediaSourceInfo: sourceType === 'stream' ? mediaSourceInfo : undefined,
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

function formatContainerName(bitrate: number, container: string): string {
	let formattedContainer = container.toUpperCase()

	if (formattedContainer.includes('MOV')) {
		if (bitrate > 256) formattedContainer = 'ALAC'
		else formattedContainer = 'AAC'
	}

	return formattedContainer
}
