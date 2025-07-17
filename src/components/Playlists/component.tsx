import { FlatList, RefreshControl } from 'react-native-gesture-handler'
import { ItemCard } from '../Global/components/item-card'
import Icon from '../Global/components/icon'
import { getToken, getTokens, Separator } from 'tamagui'
import { fetchFavoritePlaylists } from '../../api/queries/favorites'
import { QueryKeys } from '../../enums/query-keys'
import { useQuery } from '@tanstack/react-query'
import { useJellifyContext } from '../../providers'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackParamList } from '../types'
import { useDisplayContext } from '../../providers/Display/display-provider'
import { useLayoutEffect } from 'react'
import { FlashList } from '@shopify/flash-list'
import ItemRow from '../Global/components/item-row'

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

	return (
		<FlashList
			contentInsetAdjustmentBehavior='automatic'
			data={playlists}
			refreshControl={<RefreshControl refreshing={isPending} onRefresh={refetch} />}
			ItemSeparatorComponent={() => <Separator />}
			renderItem={({ index, item: playlist }) => (
				<ItemRow
					item={playlist}
					onPress={() => {
						navigation.navigate('Playlist', { playlist })
					}}
					navigation={navigation}
					queueName={playlist.Name ?? 'Untitled Playlist'}
				/>
			)}
		/>
	)
}
