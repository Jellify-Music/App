import { Spacer, XStack } from 'tamagui'

import Icon from '../../Global/components/icon'

import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../screens/types'
import { useNavigation } from '@react-navigation/native'
import { PlayerParamList } from '../../../screens/Player/types'
import { CastButton, MediaHlsSegmentFormat, useRemoteMediaClient } from 'react-native-google-cast'
import { useNowPlayingContext } from '../../../providers/Player'
import { useActiveTrack } from 'react-native-track-player'
import { fetchMediaInfo } from '../../../api/queries/media'
import { useJellifyContext } from '../../../providers'
import { getQualityParams } from '../../../utils/mappings'

export default function Footer(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<PlayerParamList>>()
	const { api, user } = useJellifyContext()

	const remoteMediaClient = useRemoteMediaClient()

	const nowPlaying = useNowPlayingContext()
	console.log(nowPlaying, 'dkjowpopwq')

	const trackPlyaer = useActiveTrack()
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

	if (remoteMediaClient && trackPlyaer?.url) {
		remoteMediaClient.loadMedia({
			mediaInfo: {
				contentUrl: sanitizeJellyfinUrl(trackPlyaer?.url).url,
				contentType: `audio/${sanitizeJellyfinUrl(trackPlyaer?.url).extension}`,
				hlsSegmentFormat: MediaHlsSegmentFormat.MP3,
				metadata: {
					type: 'musicTrack',
					title: trackPlyaer?.title,
					artist: trackPlyaer?.artist,
					albumTitle: trackPlyaer?.album || '',
					releaseDate: trackPlyaer?.date || '',
					images: [{ url: trackPlyaer?.artwork || '' }],
				},
			},
		})
	}

	return (
		<XStack justifyContent='center' alignItems='center' backgroundColor='red'>
			<XStack alignItems='center' justifyContent='flex-start' flex={1}>
				<CastButton style={{ width: 22, height: 22 }} />
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
