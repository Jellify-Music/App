import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { StackNavigationProp } from '@react-navigation/stack'
import { StackParamList } from '../../types'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { getToken, getTokens, Separator, View, XStack, YStack } from 'tamagui'
import { AnimatedH5 } from '../../Global/helpers/text'
import InstantMixButton from '../../Global/components/instant-mix-button'
import Icon from '../../Global/components/icon'
import { usePlaylistContext } from '../../../providers/Playlist'
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated'
import FastImage from 'react-native-fast-image'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { useJellifyContext } from '../../../providers'
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { useNetworkContext } from '../../../../src/providers/Network'
import { ActivityIndicator } from 'react-native'
import { mapDtoToTrack } from '../../../../src/helpers/mappings'

export default function PlayliistTracklistHeader(
	playlist: BaseItemDto,
	navigation: StackNavigationProp<StackParamList>,
	editing: boolean,
	playlistTracks: BaseItemDto[],
): React.JSX.Element {
	const { api } = useJellifyContext()

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
						<FastImage
							source={{
								uri: getImageApi(api!).getItemImageUrlById(
									playlist.Id!,
									ImageType.Primary,
								),
							}}
							style={{
								width: '100%',
								height: '100%',
								padding: getToken('$2'),
								alignSelf: 'center',
								borderRadius: getToken('$2'),
							}}
						/>
					</Animated.View>
				</YStack>

				<Animated.View style={[animatedNameStyle]}>
					<AnimatedH5
						lineBreakStrategyIOS='standard'
						textAlign='center'
						numberOfLines={5}
					>
						{playlist.Name ?? 'Untitled Playlist'}
					</AnimatedH5>

					<PlaylistHeaderControls
						editing={editing}
						setEditing={setEditing}
						navigation={navigation}
						playlist={playlist}
						playlistTracks={playlistTracks}
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
	navigation,
	playlist,
	playlistTracks,
}: {
	editing: boolean
	setEditing: (editing: boolean) => void
	navigation: StackNavigationProp<StackParamList>
	playlist: BaseItemDto
	playlistTracks: BaseItemDto[]
}): React.JSX.Element {
	const { useDownloadMultiple, pendingDownloads } = useNetworkContext()
	const isDownloading = pendingDownloads.length != 0
	const { sessionId, api } = useJellifyContext()

	const downloadPlaylist = () => {
		if (!api || !sessionId) return
		const jellifyTracks = playlistTracks.map((item) => mapDtoToTrack(api, sessionId, item, []))
		useDownloadMultiple.mutate(jellifyTracks)
	}
	return (
		<XStack justifyContent='center' marginVertical={'$2'} gap={'$4'}>
			<YStack justifyContent='center' alignContent='center'>
				{editing ? (
					<Icon
						color={'$danger'}
						name='delete-sweep-outline' // otherwise use "delete-circle"
						onPress={() => navigation.navigate('DeletePlaylist', { playlist })}
					/>
				) : (
					<InstantMixButton item={playlist} navigation={navigation} />
				)}
			</YStack>

			<YStack justifyContent='center' alignContent='center'>
				<Icon
					color={'$borderColor'}
					name={editing ? 'content-save-outline' : 'pencil'}
					onPress={() => setEditing(!editing)}
				/>
			</YStack>
			<YStack justifyContent='center' alignContent='center'>
				{!isDownloading ? (
					<Icon color={'$borderColor'} name={'download'} onPress={downloadPlaylist} />
				) : (
					<ActivityIndicator />
				)}
			</YStack>
		</XStack>
	)
}
