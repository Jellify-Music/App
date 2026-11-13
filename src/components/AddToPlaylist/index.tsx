import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { View } from 'tamagui'
import { useRecentlyUpdatedPlaylists } from '../../api/queries/playlist'
import { AnimatedList } from '../Global/components/Lists/utils'
import type { LegendListRenderItemProps } from '@legendapp/list/react-native'
import { LinearTransition } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AddToPlaylistRow from './components/row'
import AddToPlaylistHeader from './components/header'

export default function AddToPlaylist({
	tracks,
	source,
}: {
	tracks: BaseItemDto[]
	source?: BaseItemDto
}): React.JSX.Element {
	const {
		data: playlists,
		isPending: playlistsFetchPending,
		isSuccess: playlistsFetchSuccess,
	} = useRecentlyUpdatedPlaylists()

	const { bottom } = useSafeAreaInsets()

	const renderItem = ({ item: playlist }: LegendListRenderItemProps<BaseItemDto>) => (
		<AddToPlaylistRow
			playlist={playlist}
			tracks={tracks ? tracks : tracks[0] ? [tracks[0]] : []}
		/>
	)

	return (
		<View flex={1}>
			<AddToPlaylistHeader source={source} tracks={tracks} />
			{!playlistsFetchPending && playlistsFetchSuccess && (
				// Adding to a playlist moves it to the front of the list, so animate the reorder
				<AnimatedList<BaseItemDto>
					data={playlists}
					itemLayoutAnimation={LinearTransition.springify()}
					renderItem={renderItem}
					contentContainerStyle={{
						marginTop: 12,
						paddingBottom: bottom,
					}}
				/>
			)}
		</View>
	)
}
