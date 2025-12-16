import { BaseItemDto, MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ListItem, View, YGroup, YStack } from 'tamagui'
import Icon from '../Global/components/icon'
import { Text } from '../Global/helpers/text'
import { RootStackParamList } from '../../screens/types'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useEffect } from 'react'
import { parseBitrateFromTranscodingUrl } from '../../utils/url-parsers'
import { SourceType } from '../../types/JellifyTrack'
import { capitalize } from 'lodash'
import { StreamOptions } from '../../api/core/types'

interface AudioSpecsProps {
	item: BaseItemDto
	streamingMediaSourceInfo?: MediaSourceInfo
	downloadedMediaSourceInfo?: MediaSourceInfo
	navidromeStreamOptions?: StreamOptions
	navigation: NativeStackNavigationProp<RootStackParamList>
}

export default function AudioSpecs({
	item,
	streamingMediaSourceInfo,
	downloadedMediaSourceInfo,
	navidromeStreamOptions,
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

			{navidromeStreamOptions && (
				<NavidromeSourceInfoView streamOptions={navidromeStreamOptions} />
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
				<Text bold>{`${capitalize(type)} Specs`}</Text>
			</ListItem>
			<ListItem gap={'$2'} justifyContent='flex-start'>
				<Icon
					small
					name={type === 'download' ? 'file-music' : 'radio-tower'}
					color='$primary'
				/>

				<Text bold>
					{type === 'download'
						? 'Downloaded File'
						: TranscodingUrl
							? 'Transcoded Stream'
							: 'Direct Stream'}
				</Text>
			</ListItem>
			{bitrate && (
				<YGroup.Item>
					<ListItem gap={'$2'} justifyContent='flex-start'>
						<Icon small name='sine-wave' color={'$primary'} />

						<Text
							bold
							fontVariant={['tabular-nums']}
						>{`${Math.floor(bitrate / 1000)}kbps`}</Text>
					</ListItem>
				</YGroup.Item>
			)}

			{container && (
				<YGroup.Item>
					<ListItem gap={'$2'} justifyContent='flex-start'>
						<Icon small name='music-box-outline' color={'$primary'} />

						<Text bold>{container.toUpperCase()}</Text>
					</ListItem>
				</YGroup.Item>
			)}
		</YGroup>
	)
}

function NavidromeSourceInfoView({
	streamOptions,
}: {
	streamOptions: StreamOptions
}): React.JSX.Element {
	const format = streamOptions.format ?? 'raw'
	const bitrate = streamOptions.maxBitrate

	const isOriginal = format.toLowerCase() === 'raw' && !bitrate

	return (
		<YGroup>
			<ListItem justifyContent='flex-start'>
				<Text bold>Stream Specs</Text>
			</ListItem>
			<ListItem gap={'$2'} justifyContent='flex-start'>
				<Icon small name='radio-tower' color='$primary' />
				<Text bold>{isOriginal ? 'Original Quality' : 'Transcoded Stream'}</Text>
			</ListItem>
			{bitrate && (
				<YGroup.Item>
					<ListItem gap={'$2'} justifyContent='flex-start'>
						<Icon small name='sine-wave' color={'$primary'} />
						<Text bold fontVariant={['tabular-nums']}>{`${bitrate}kbps`}</Text>
					</ListItem>
				</YGroup.Item>
			)}
			{format && (
				<YGroup.Item>
					<ListItem gap={'$2'} justifyContent='flex-start'>
						<Icon small name='music-box-outline' color={'$primary'} />
						<Text bold>{format.toUpperCase()}</Text>
					</ListItem>
				</YGroup.Item>
			)}
		</YGroup>
	)
}
