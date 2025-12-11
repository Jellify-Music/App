import { useTheme, XStack, View } from 'tamagui'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'
import { PlayerParamList } from '../../../screens/Player/types'
import { CastButton, MediaHlsSegmentFormat, useRemoteMediaClient } from 'react-native-google-cast'
import { useEffect } from 'react'
import usePlayerEngineStore from '../../../stores/player/engine'
import useRawLyrics from '../../../api/queries/lyrics'
import Animated, {
	FadeIn,
	FadeOut,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from 'react-native-reanimated'
import { useCurrentTrack } from '../../../stores/player/queue'
import { Pressable, StyleSheet } from 'react-native'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'

export default function Footer(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<PlayerParamList>>()
	const playerEngineData = usePlayerEngineStore((state) => state.playerEngineData)
	const theme = useTheme()

	const remoteMediaClient = useRemoteMediaClient()

	const nowPlaying = useCurrentTrack()

	const { data: lyrics } = useRawLyrics()

	// Pulse animation for lyrics button when available
	const pulseOpacity = useSharedValue(1)

	useEffect(() => {
		if (lyrics) {
			pulseOpacity.value = withRepeat(
				withSequence(withTiming(0.6, { duration: 800 }), withTiming(1, { duration: 800 })),
				3,
				true,
			)
		}
	}, [lyrics, pulseOpacity])

	const lyricsAnimatedStyle = useAnimatedStyle(() => ({
		opacity: pulseOpacity.value,
	}))

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

	const loadMediaToCast = async () => {
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
		<XStack justifyContent='space-between' alignItems='center' paddingTop='$2'>
			{/* Left section: Cast + Lyrics with styled containers */}
			<XStack alignItems='center' gap='$2' flex={1}>
				{/* Cast button in subtle circular container */}
				<View style={[styles.iconCircle, { borderColor: theme.color.val + '40' }]}>
					<CastButton style={{ tintColor: theme.color.val, width: 20, height: 20 }} />
				</View>

				{lyrics && (
					<Animated.View entering={FadeIn} exiting={FadeOut} style={lyricsAnimatedStyle}>
						<Pressable
							onPress={() => navigation.navigate('LyricsScreen', { lyrics: lyrics })}
							style={[styles.iconCircle, { borderColor: theme.primary.val }]}
						>
							<MaterialDesignIcons
								name='message-text-outline'
								size={20}
								color={theme.primary.val}
							/>
						</Pressable>
					</Animated.View>
				)}
			</XStack>

			{/* Right section: Queue button with pill emphasis */}
			<View style={styles.queueContainer}>
				<Pressable
					onPress={() => navigation.navigate('QueueScreen')}
					testID='queue-button-test-id'
					style={[styles.queueButton, { borderColor: theme.color.val + '50' }]}
				>
					<MaterialDesignIcons name='playlist-music' size={20} color={theme.color.val} />
				</Pressable>
			</View>
		</XStack>
	)
}

const styles = StyleSheet.create({
	iconCircle: {
		width: 40,
		height: 40,
		borderRadius: 20,
		borderWidth: 1.5,
		alignItems: 'center',
		justifyContent: 'center',
	},
	queueContainer: {
		alignItems: 'flex-end',
	},
	queueButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 20,
		borderWidth: 1.5,
		gap: 6,
	},
})
