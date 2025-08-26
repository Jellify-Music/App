import { getToken, Spacer, useTheme, XStack } from 'tamagui'

import Icon from '../../Global/components/icon'

import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'
import { PlayerParamList } from '../../../screens/Player/types'
import {
	CastButton,
	MediaHlsSegmentFormat,
	useMediaStatus,
	useRemoteMediaClient,
} from 'react-native-google-cast'
import { useNowPlaying } from '../../../providers/Player/hooks/queries'
import { useActiveTrack } from 'react-native-track-player'
import { useJellifyContext } from '../../../providers'
import { useEffect } from 'react'
import usePlayerEngineStore, { PlayerEngine } from '../../../stores/player-engine'

export default function Footer(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<PlayerParamList>>()
	const playerEngineData = usePlayerEngineStore((state) => state.playerEngineData)
	const theme = useTheme()

	const remoteMediaClient = useRemoteMediaClient()

	// const mediaStatus = useMediaStatus()
	// console.log('mediaStatus', mediaStatus)
	const { data: nowPlaying } = useNowPlaying()

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
			url: `${sanitizedBase}?${params.toString()}`,
			extension: chosenExt,
		}
	}

	const loadMediaToCast = async () => {
		console.log('loadMediaToCast', remoteMediaClient, nowPlaying?.url, playerEngineData)

		if (remoteMediaClient && nowPlaying?.url) {
			const mediaStatus = await remoteMediaClient.getMediaStatus()

			const sanitizedUrl = sanitizeJellyfinUrl(nowPlaying?.url)

			if (mediaStatus?.mediaInfo?.contentUrl !== sanitizedUrl.url) {
				remoteMediaClient.loadMedia({
					mediaInfo: {
						contentUrl: sanitizeJellyfinUrl(nowPlaying?.url).url,
						contentType: `audio/${sanitizeJellyfinUrl(nowPlaying?.url).extension}`,
						hlsSegmentFormat: MediaHlsSegmentFormat.MP3,
						metadata: {
							type: 'musicTrack',
							title: nowPlaying?.title,
							artist: nowPlaying?.artist,
							albumTitle: nowPlaying?.album || '',
							releaseDate: nowPlaying?.date || '',
							images: [{ url: nowPlaying?.artwork || '' }],
						},
					},
				})
			}
		}
	}
	useEffect(() => {
		loadMediaToCast()
	}, [remoteMediaClient, nowPlaying, playerEngineData])

	return (
		<XStack justifyContent='center' alignItems='center'>
			<XStack alignItems='center' justifyContent='flex-start' flex={1}>
				<CastButton style={{ tintColor: theme.color.val, width: 22, height: 22 }} />
			</XStack>

			<Spacer flex={1} />

			<XStack alignItems='center' justifyContent='flex-end' flex={1}>
				<Icon
					small
					testID='queue-button-test-id'
					name='playlist-music'
					onPress={() => {
						navigation.navigate('QueueScreen')
					}}
				/>
			</XStack>
		</XStack>
	)
}
