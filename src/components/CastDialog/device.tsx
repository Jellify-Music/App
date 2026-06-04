import React from 'react'
import CastContext, { Device, MediaHlsSegmentFormat } from 'react-native-google-cast'
import { Paragraph, XStack, YStack } from 'tamagui'
import Icon from '../Global/components/icon'
import { usePlayerQueueStore } from '../../stores/player/queue'

interface CastDeviceProps {
	item: Device
}

export default function CastDevice({ item: device }: CastDeviceProps): React.JSX.Element {
	const { deviceId, friendlyName, modelName } = device

	const onPress = async () => {
		const sessionManager = CastContext.getSessionManager()

		const startSessionResult = await sessionManager.startSession(deviceId)

		await loadMediaToCast()
	}

	return (
		<XStack alignItems='center' onPress={onPress} paddingVertical={'$2'} gap='$2'>
			<Icon name='speaker' />

			<YStack alignItems='flex-start'>
				<Paragraph fontWeight={'$6'}>{friendlyName}</Paragraph>
				<Paragraph color='$borderColor'>{modelName}</Paragraph>
			</YStack>
		</XStack>
	)
}

const loadMediaToCast = async () => {
	const sessionManager = CastContext.getSessionManager()

	const session = await sessionManager.getCurrentCastSession()

	const { queue, currentIndex } = usePlayerQueueStore.getState()

	const nowPlaying = currentIndex !== undefined && queue[currentIndex]

	if (session?.client && nowPlaying && nowPlaying.url) {
		const mediaStatus = await session.client.getMediaStatus()

		const sanitizedUrl = sanitizeJellyfinUrl(nowPlaying?.url)

		if (mediaStatus?.mediaInfo?.contentUrl !== sanitizedUrl.url) {
			await session.client.loadMedia({
				mediaInfo: {
					contentUrl: sanitizeJellyfinUrl(nowPlaying?.url).url,
					contentType: `audio/${sanitizeJellyfinUrl(nowPlaying?.url).extension}`,
					hlsSegmentFormat: MediaHlsSegmentFormat.MP3,
					metadata: {
						type: 'musicTrack',
						title: nowPlaying?.title,
						artist: nowPlaying?.artist,
						albumTitle: nowPlaying?.album || '',
						images: [{ url: nowPlaying?.artwork || '' }],
					},
				},
			})
		}
	}
}

function sanitizeJellyfinUrl(url: string): { url: string; extension: string | null } {
	// Priority order for extensions
	const priority = ['mp4', 'mp3', 'mov', 'm4a', '3gp']

	// Extract base URL and query params
	const [base, query] = url.split('?')
	let sanitizedBase = base
	let chosenExt: string | null = null

	if (base.includes(',')) {
		const parts = base.split('/')
		const lastPart = parts.pop() || ''
		const [streamBase, exts] = lastPart.split('stream.')
		const extList = exts.split(',')

		// Find best extension by priority
		chosenExt = priority.find((ext) => extList.includes(ext)) || null

		if (chosenExt) {
			sanitizedBase = [...parts, `stream.${chosenExt}`].join('/')
		}
	} else {
		// Handle single extension (no commas in base)
		const match = base.match(/stream\.(\w+)$/)
		chosenExt = match ? match[1] : null
	}

	// Update query params
	const params = new URLSearchParams(query)
	params.set('static', 'false')

	return {
		url,
		extension: chosenExt,
	}
}
