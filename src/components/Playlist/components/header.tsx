import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { H5, Spacer, XStack, YStack } from 'tamagui'
import { InstantMixButton } from '../../Global/components/instant-mix-button'
import Icon from '../../Global/components/icon'
import { useNetworkStatus } from '../../../stores/network'
import { QueuingType } from '../../../enums/queuing-type'
import { useNavigation } from '@react-navigation/native'
import LibraryStackParamList from '@/src/screens/Library/types'
import { useLoadNewQueue } from '../../../providers/Player/hooks/mutations'
import useStreamingDeviceProfile from '../../../stores/device-profile'
import ItemImage from '../../Global/components/image'
import { useApi } from '../../../stores'
import Input from '../../Global/helpers/input'
import Animated, {
	FadeInDown,
	FadeInUp,
	FadeOutDown,
	LinearTransition,
} from 'react-native-reanimated'
import { Dispatch, SetStateAction } from 'react'
import Button from '../../Global/helpers/button'
import { Text } from '../../Global/helpers/text'
import { RunTimeTicks } from '../../Global/helpers/time-codes'

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
		<YStack paddingTop={'$1'} marginBottom={'$2'} gap={'$2'}>
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
						fontSize={'$8'}
						fontWeight='bold'
						clearButtonMode='while-editing'
						marginHorizontal={'$4'}
					/>
				</Animated.View>
			) : (
				<Animated.View entering={FadeInDown} exiting={FadeOutDown}>
					<YStack alignItems='center' gap={'$2'}>
						<H5 lineBreakStrategyIOS='standard' textAlign='center' numberOfLines={5}>
							{newName ?? 'Untitled Playlist'}
						</H5>

						<RunTimeTicks>{playlist.RunTimeTicks}</RunTimeTicks>
					</YStack>
				</Animated.View>
			)}

			{!editing ? (
				<Animated.View entering={FadeInDown} exiting={FadeOutDown} style={{ flex: 1 }}>
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
	playlist,
	playlistTracks,
}: {
	editing: boolean
	playlist: BaseItemDto
	playlistTracks: BaseItemDto[]
}): React.JSX.Element {
	const streamingDeviceProfile = useStreamingDeviceProfile()
	const loadNewQueue = useLoadNewQueue()
	const api = useApi()

	const [networkStatus] = useNetworkStatus()

	const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>()

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
		<XStack justifyContent='center' marginHorizontal={'$2'} gap={'$2'}>
			<Animated.View
				style={{
					flex: 2,
				}}
				entering={FadeInUp.springify()}
				exiting={FadeOutDown.springify()}
				layout={LinearTransition.springify()}
			>
				<Button
					animation={'bouncy'}
					pressStyle={{ scale: 0.875 }}
					hoverStyle={{ scale: 0.925 }}
					borderColor={'$primary'}
					borderWidth={'$1'}
					onPress={() => playPlaylist(false)}
					icon={<Icon name='play' color='$primary' small />}
				>
					<Text bold color={'$primary'}>
						Play
					</Text>
				</Button>
			</Animated.View>

			<InstantMixButton item={playlist} navigation={navigation} />

			<Animated.View
				style={{
					flex: 2,
				}}
				entering={FadeInUp.springify()}
				exiting={FadeOutDown.springify()}
				layout={LinearTransition.springify()}
			>
				<Button
					animation={'bouncy'}
					pressStyle={{ scale: 0.875 }}
					hoverStyle={{ scale: 0.925 }}
					borderColor={'$primary'}
					borderWidth={'$1'}
					onPress={() => playPlaylist(true)}
					icon={<Icon name='shuffle' color='$primary' small />}
				>
					<Text bold color={'$primary'}>
						Shuffle
					</Text>
				</Button>
			</Animated.View>
		</XStack>
	)
}
