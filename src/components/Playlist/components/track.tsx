import { usePlaylistContext } from '../../../providers/Playlist'
import { loadNewQueue } from '../../../hooks/player/functions/queue'
import { BaseStackParamList, RootStackParamList } from '@/src/screens/types'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ListRenderItemInfo, StyleSheet } from 'react-native'
import { DraxHandle } from 'react-native-drax'
import Icon from '../../Global/components/icon'
import Track from '../../Global/components/Track'
import { XStack } from 'tamagui'
import { LegendListRenderItemProps } from '@legendapp/list/react-native'

export default function PlaylistTrack({
	item: track,
	index,
	...props
}: LegendListRenderItemProps<BaseItemDto>) {
	const { playlist, playlistTracks, onRemoveTrack, editing } = usePlaylistContext()

	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()
	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const handlePress = async () => {
		await loadNewQueue({
			track,
			tracklist: playlistTracks ?? [],
			index,
			queue: playlist,
			startPlayback: true,
		})
	}

	const onLongPress = () =>
		rootNavigation.navigate('Context', {
			item: track,
			navigation,
			playlist,
		})

	const onRemove = () => onRemoveTrack(track)

	return editing ? (
		<XStack alignItems='center'>
			<DraxHandle style={styles.handle}>
				<Icon name='drag' flexShrink={1} />
			</DraxHandle>

			<Track
				onPress={handlePress}
				onLongPress={onLongPress}
				navigation={navigation}
				track={track}
				tracklist={playlistTracks ?? []}
				index={index}
				queue={playlist}
				playlist={playlist}
				showArtwork
				editing={editing}
			/>

			<Icon name='close' color={'$warning'} flexShrink={1} onPress={onRemove} />
		</XStack>
	) : (
		<Track
			onPress={handlePress}
			onLongPress={onLongPress}
			navigation={navigation}
			track={track}
			tracklist={playlistTracks ?? []}
			index={index}
			queue={playlist}
			playlist={playlist}
			showArtwork
			editing={editing}
			testID={`playlist-track-${index}`}
		/>
	)
}

const styles = StyleSheet.create({
	item: {
		flexDirection: 'row',
		alignContent: 'center',
		flex: 1,
	},
	handle: {
		flexShrink: 1,
	},
})
