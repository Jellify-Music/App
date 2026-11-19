import { BaseItemDto, MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client'
import { ListItem, SizableText, View, YGroup } from 'tamagui'
import Icon from '../Global/components/icon'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useEffect } from 'react'
import { parseBitrateFromTranscodingUrl } from '../../utils/audio/transcoding'
import { SourceType } from '../../types/JellifyTrack'
import { capitalize } from 'lodash'
import { useTranslation } from 'react-i18next'

interface AudioSpecsProps {
	item: BaseItemDto
	streamingMediaSourceInfo?: MediaSourceInfo
	downloadedMediaSourceInfo?: MediaSourceInfo
}

export default function AudioSpecs({
	item,
	streamingMediaSourceInfo,
	downloadedMediaSourceInfo,
}: AudioSpecsProps): React.JSX.Element {
	const { bottom } = useSafeAreaInsets()

	return (
		<View paddingBottom={bottom}>
			{streamingMediaSourceInfo && (
				<MediaSourceInfoView type='stream' mediaInfo={streamingMediaSourceInfo} />
			)}

			{downloadedMediaSourceInfo && (
				<MediaSourceInfoView type='download' mediaInfo={downloadedMediaSourceInfo} />
			)}
		</View>
	)
}

function MediaSourceInfoView({
	mediaInfo,
	type,
}: {
	mediaInfo: MediaSourceInfo
	type: SourceType
}): React.JSX.Element {
	const { t } = useTranslation()

	const { Bitrate, Container, TranscodingUrl, TranscodingContainer } = mediaInfo

	const bitrate = TranscodingUrl ? parseBitrateFromTranscodingUrl(TranscodingUrl) : Bitrate
	const container = TranscodingContainer || Container

	useEffect(() => {}, [])

	return (
		<YGroup>
			<ListItem justifyContent='flex-start'>
				<SizableText fontWeight='6'>{`${capitalize(type)} Specs`}</SizableText>
			</ListItem>
			<ListItem gap='2' justifyContent='flex-start'>
				<Icon
					size='7'
					name={type === 'download' ? 'file-music' : 'radio-tower'}
					color='primary'
				/>

				<SizableText fontWeight='6'>
					{type === 'download'
						? t('audioSpecs.downloadedFile')
						: TranscodingUrl
							? t('audioSpecs.transcodedStream')
							: t('audioSpecs.directStream')}
				</SizableText>
			</ListItem>
			{bitrate && (
				<YGroup.Item>
					<ListItem gap='2' justifyContent='flex-start'>
						<Icon size='7' name='sine-wave' color={'primary'} />

						<SizableText
							fontWeight='6'
							fontVariant={['tabular-nums']}
						>{`${Math.floor(bitrate / 1000)}kbps`}</SizableText>
					</ListItem>
				</YGroup.Item>
			)}

			{container && (
				<YGroup.Item>
					<ListItem gap='2' justifyContent='flex-start'>
						<Icon size='7' name='music-box-outline' color={'primary'} />

						<SizableText fontWeight='6'>{container.toUpperCase()}</SizableText>
					</ListItem>
				</YGroup.Item>
			)}
		</YGroup>
	)
}
