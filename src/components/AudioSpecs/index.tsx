import { BaseItemDto, MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ListItem, SizableText, View, YGroup, YStack } from 'tamagui'
import Icon from '../Global/components/icon'
import { RootStackParamList } from '../../screens/types'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useEffect } from 'react'
import { parseBitrateFromTranscodingUrl } from '../../utils/parsing/url'
import { SourceType } from '../../types/JellifyTrack'
import { capitalize } from 'lodash'

interface AudioSpecsProps {
	item: BaseItemDto
	streamingMediaSourceInfo?: MediaSourceInfo
	downloadedMediaSourceInfo?: MediaSourceInfo
	navigation: NativeStackNavigationProp<RootStackParamList>
}

export default function AudioSpecs({
	item,
	streamingMediaSourceInfo,
	downloadedMediaSourceInfo,
	navigation,
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
						? 'Downloaded File'
						: TranscodingUrl
							? 'Transcoded Stream'
							: 'Direct Stream'}
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
