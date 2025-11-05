import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { getTokens, Separator, View, XStack, YStack } from 'tamagui'
import { AnimatedH5 } from '../../Global/helpers/text'
import InstantMixButton from '../../Global/components/instant-mix-button'
import Icon from '../../Global/components/icon'
import { usePlaylistContext } from '../../../providers/Playlist'
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { useNetworkStatus } from '../../../../src/stores/network'
import { useNetworkContext } from '../../../../src/providers/Network'
import { ActivityIndicator } from 'react-native'
import { mapDtoToTrack } from '../../../utils/mappings'
import { QueuingType } from '../../../enums/queuing-type'
import { useNavigation } from '@react-navigation/native'
import LibraryStackParamList from '@/src/screens/Library/types'
import { useLoadNewQueue } from '../../../providers/Player/hooks/mutations'
import useStreamingDeviceProfile, {
	useDownloadingDeviceProfile,
} from '../../../stores/device-profile'
import ItemImage from '../../Global/components/image'
import { useApi } from '../../../stores'

export default function PlayliistTracklistHeader(
	playlist: BaseItemDto,
	editing: boolean,
	playlistTracks: BaseItemDto[],
	canEdit: boolean | undefined,
): React.JSX.Element {
	const { width } = useSafeAreaFrame()

	const { setEditing, scroll } = usePlaylistContext()

	const artworkSize = 200

	const textSize = getTokens().size['$12'].val

	const animatedArtworkStyle = useAnimatedStyle(() => {
		'worklet'
		return {
			height: withSpring(Math.max(0, Math.min(artworkSize, artworkSize - scroll.value * 2)), {
				stiffness: 100,
				damping: 25,
			}),
			width: withSpring(Math.max(0, Math.min(artworkSize, artworkSize - scroll.value * 2)), {
				stiffness: 100,
				damping: 25,
			}),
			display: scroll.value * 3 > artworkSize ? 'none' : 'flex',
		}
	})

	const animatedNameStyle = useAnimatedStyle(() => {
		'worklet'

		const clampedWidth = Math.max(
			// Prevent the name from getting too small
			width / 2.5,
			Math.min(
				// Prevent the name from getting too large
				width / 1.1,
				width / 2.25 + scroll.value * 2,
			),
		)

		return {
			width: withSpring(clampedWidth, {
				stiffness: 100,
				damping: 25,
			}),
			height: withSpring(Math.max(textSize, artworkSize - scroll.value), {
				stiffness: 100,
				damping: 25,
			}),
			alignContent: 'center',
			justifyContent: 'center',
		}
	})

	return (
		<View backgroundColor={'$background'} borderRadius={'$2'}>
			<XStack
				justifyContent='flex-start'
				alignItems='flex-start'
				paddingTop={'$1'}
				marginBottom={'$2'}
			>
				<YStack justifyContent='center' alignContent='center' padding={'$2'}>
					<Animated.View style={[animatedArtworkStyle]}>
						<ItemImage item={playlist} />
					</Animated.View>
				</YStack>

				<Animated.View style={[animatedNameStyle, { flex: 1 }]}>
					<AnimatedH5
						lineBreakStrategyIOS='standard'
						textAlign='center'
						numberOfLines={5}
						marginBottom={'$2'}
					>
						{playlist.Name ?? 'Untitled Playlist'}
					</AnimatedH5>

					<PlaylistHeaderControls
						editing={editing}
						setEditing={setEditing}
						playlist={playlist}
						playlistTracks={playlistTracks}
						canEdit={canEdit}
					/>
				</Animated.View>
			</XStack>
			<Separator />
		</View>
	)
}

function PlaylistHeaderControls({
	editing,
	setEditing,
	playlist,
	playlistTracks,
	canEdit,
}: {
	editing: boolean
	setEditing: (editing: boolean) => void
	playlist: BaseItemDto
	playlistTracks: BaseItemDto[]
	canEdit: boolean | undefined
}): React.JSX.Element {
	const { addToDownloadQueue, pendingDownloads } = useNetworkContext()
	const streamingDeviceProfile = useStreamingDeviceProfile()
	const downloadingDeviceProfile = useDownloadingDeviceProfile()
	const loadNewQueue = useLoadNewQueue()
	const isDownloading = pendingDownloads.length != 0
	const api = useApi()

	const [networkStatus] = useNetworkStatus()

	const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>()

	const downloadPlaylist = () => {
		if (!api) return
		const jellifyTracks = playlistTracks.map((item) =>
			mapDtoToTrack(api, item, [], downloadingDeviceProfile),
		)
		addToDownloadQueue(jellifyTracks)
	}

	const playPlaylist = (shuffled: boolean = false) => {
		if (!playlistTracks || playlistTracks.length === 0) return

		loadNewQueue({
			api,
			networkStatus,
			deviceProfile: streamingDeviceProfile,
			track: playlistTracks[0],
			index: 0,
			tracklist: playlistTracks,
			queue: playlist,
			queuingType: QueuingType.FromSelection,
			shuffled,
			startPlayback: true,
		})
	}

	return (
		<XStack justifyContent='center' marginVertical={'$1'} gap={'$2'} flexWrap='wrap'>
			<YStack justifyContent='center' alignContent='center'>
				{editing && canEdit ? (
					<Icon
						color={'$danger'}
						name='delete-sweep-outline' // otherwise use "delete-circle"
						onPress={() => {
							navigation.push('DeletePlaylist', { playlist })
						}}
						small
					/>
				) : (
					<InstantMixButton item={playlist} navigation={navigation} />
				)}
			</YStack>

			<YStack justifyContent='center' alignContent='center'>
				<Icon name='play' onPress={() => playPlaylist(false)} small />
			</YStack>

			<YStack justifyContent='center' alignContent='center'>
				<Icon name='shuffle' onPress={() => playPlaylist(true)} small />
			</YStack>

			{canEdit && (
				<YStack justifyContent='center' alignContent='center'>
					<Icon
						color={'$borderColor'}
						name={editing ? 'content-save-outline' : 'pencil'}
						onPress={() => setEditing(!editing)}
						small
					/>
				</YStack>
			)}
			<YStack justifyContent='center' alignContent='center'>
				{!isDownloading ? (
					<Icon
						color={'$borderColor'}
						name={'download'}
						onPress={downloadPlaylist}
						small
					/>
				) : (
					<ActivityIndicator />
				)}
			</YStack>
		</XStack>
	)
}
