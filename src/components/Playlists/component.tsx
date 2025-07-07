import { FlatList, RefreshControl } from 'react-native-gesture-handler'
import { ItemCard } from '../Global/components/item-card'
import Icon from '../Global/components/icon'
import { getToken, getTokens } from 'tamagui'
import { fetchFavoritePlaylists } from '../../api/queries/favorites'
import { QueryKeys } from '../../enums/query-keys'
import { useQuery } from '@tanstack/react-query'
import { useJellifyContext } from '../../providers'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackParamList } from '../types'
import { useDisplayContext } from '../../providers/Display/display-provider'
import { useLayoutEffect } from 'react'

export default function Playlists({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { api, user, library } = useJellifyContext()

	// Move navigation.setOptions to useLayoutEffect to prevent render-time setState
	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => {
				return (
					<Icon
						name='plus-circle-outline'
						color={'$secondary'}
						onPress={() => navigation.navigate('AddPlaylist')}
					/>
				)
			},
		})
	}, [navigation])

	const {
		data: playlists,
		isPending,
		refetch,
	} = useQuery({
		queryKey: [QueryKeys.UserPlaylists],
		queryFn: () => fetchFavoritePlaylists(api, user, library),
	})

	const { numberOfColumns } = useDisplayContext()

	return (
		<FlatList
			contentContainerStyle={{
				flexGrow: 1,
				alignItems: 'center',
				marginVertical: getTokens().size.$1.val,
			}}
			contentInsetAdjustmentBehavior='automatic'
			numColumns={numberOfColumns}
			data={playlists}
			refreshControl={<RefreshControl refreshing={isPending} onRefresh={refetch} />}
			renderItem={({ index, item: playlist }) => (
				<ItemCard
					item={playlist}
					caption={playlist.Name ?? 'Untitled Playlist'}
					onPress={() => {
						navigation.navigate('Playlist', { playlist })
					}}
					size={'$11'}
					squared
				/>
			)}
			removeClippedSubviews
		/>
	)
}
