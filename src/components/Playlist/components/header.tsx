import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { H5, Spacer, XStack, YStack } from 'tamagui'
import InstantMixButton from '../../Global/components/instant-mix-button'
import Icon from '../../Global/components/icon'
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
import Input from '../../Global/helpers/input'
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated'
import { Dispatch, SetStateAction } from 'react'

export default function PlaylistTracklistHeader({
	playlist,
	playlistTracks,
	editing,
	newName,
	setNewName,
}: {
	playlist: BaseItemDto
	playlistTracks: BaseItemDto[] | undefined
	editing: boolean
	newName: string
	setNewName: Dispatch<SetStateAction<string>>
}): React.JSX.Element {
	return (
		<YStack justifyContent='center' alignItems='center' paddingTop={'$1'} marginBottom={'$2'}>
			<YStack justifyContent='center' alignContent='center' padding={'$2'}>
				<ItemImage item={playlist} width={'$20'} height={'$20'} />
			</YStack>

			{editing ? (
				<Animated.View
					entering={FadeInDown}
					exiting={FadeOutDown}
					style={{ width: '100%' }}
				>
					<Input
						value={newName}
						onChangeText={setNewName}
						placeholder='Playlist Name'
						textAlign='center'
						fontSize={'$9'}
						fontWeight='bold'
						clearButtonMode='while-editing'
						marginHorizontal={'$4'}
					/>
				</Animated.View>
			) : (
				<Animated.View entering={FadeInDown} exiting={FadeOutDown}>
					<H5
						lineBreakStrategyIOS='standard'
						textAlign='center'
						numberOfLines={5}
						marginBottom={'$2'}
					>
						{newName ?? 'Untitled Playlist'}
					</H5>
				</Animated.View>
			)}

			{!editing ? (
				<Animated.View entering={FadeInDown} exiting={FadeOutDown}>
					<PlaylistHeaderControls
						editing={editing}
						playlist={playlist}
						playlistTracks={playlistTracks ?? []}
					/>
				</Animated.View>
			) : (
				<Spacer size='$6' />
			)}
		</YStack>
	)
}

function PlaylistHeaderControls({
	editing,
	playlist,
	playlistTracks,
}: {
	editing: boolean
	playlist: BaseItemDto
	playlistTracks: BaseItemDto[]
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
			mapDtoToTrack(api, item, downloadingDeviceProfile),
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
				<InstantMixButton item={playlist} navigation={navigation} />
			</YStack>

			<YStack justifyContent='center' alignContent='center'>
				<Icon name='play' onPress={() => playPlaylist(false)} small />
			</YStack>

			<YStack justifyContent='center' alignContent='center'>
				<Icon name='shuffle' onPress={() => playPlaylist(true)} small />
			</YStack>

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
