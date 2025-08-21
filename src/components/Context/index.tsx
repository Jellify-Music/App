import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { getToken, ListItem, ScrollView, View, YGroup } from 'tamagui'
import { BaseStackParamList, RootStackParamList } from '../../screens/types'
import { Text } from '../Global/helpers/text'
import FavoriteContextMenuRow from '../Global/components/favorite-context-menu-row'
import { useColorScheme } from 'react-native'
import { useThemeSettingContext } from '../../providers/Settings'
import LinearGradient from 'react-native-linear-gradient'
import Icon from '../Global/components/icon'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '../../enums/query-keys'
import { fetchAlbumDiscs, fetchItem } from '../../api/queries/item'
import { useJellifyContext } from '../../providers'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { useAddToQueueContext } from '../../providers/Player/queue'
import { AddToQueueMutation } from '../../providers/Player/interfaces'
import { QueuingType } from '../../enums/queuing-type'
import { useCallback, useEffect, useMemo } from 'react'
import navigationRef from '../../../navigation'
import { goToAlbumFromContextSheet, goToArtistFromContextSheet } from './utils/navigation'
import { getItemName } from '../../utils/text'
import ItemImage from '../Global/components/image'
import { StackActions } from '@react-navigation/native'
import TextTicker from 'react-native-text-ticker'
import { TextTickerConfig } from '../Player/component.config'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { trigger } from 'react-native-haptic-feedback'

type StackNavigation = Pick<NativeStackNavigationProp<BaseStackParamList>, 'navigate' | 'dispatch'>

interface ContextProps {
	item: BaseItemDto
	stackNavigation?: StackNavigation
	navigation: NativeStackNavigationProp<RootStackParamList>
	navigationCallback?: (screen: 'Album' | 'Artist', item: BaseItemDto) => void
}

export default function ItemContext({ item, stackNavigation }: ContextProps): React.JSX.Element {
	const { api } = useJellifyContext()

	const { bottom } = useSafeAreaInsets()

	const isArtist = item.Type === BaseItemKind.MusicArtist
	const isAlbum = item.Type === BaseItemKind.MusicAlbum
	const isTrack = item.Type === BaseItemKind.Audio
	const isPlaylist = item.Type === BaseItemKind.Playlist

	const { data: album } = useQuery({
		queryKey: [QueryKeys.Album, item.AlbumId],
		queryFn: () => fetchItem(api, item.AlbumId!),
		enabled: isTrack,
	})

	const { data: tracks } = useQuery({
		queryKey: [QueryKeys.ItemTracks, item.Id],
		queryFn: () =>
			getItemsApi(api!)
				.getItems({ parentId: item.Id! })
				.then(({ data }) => {
					if (data.Items) return data.Items
					else return []
				}),
		enabled: isPlaylist,
	})

	const { data: discs } = useQuery({
		queryKey: [QueryKeys.ItemTracks, item.Id],
		queryFn: () => fetchAlbumDiscs(api, item),
		enabled: isAlbum,
	})

	const renderAddToQueueRow = isTrack || (isAlbum && tracks) || (isPlaylist && tracks)

	const renderAddToPlaylistRow = isTrack

	const renderViewAlbumRow = isAlbum || (isTrack && album)

	const artistIds = !isPlaylist
		? isArtist
			? [item.Id]
			: item.ArtistItems
				? item.ArtistItems.map((item) => item.Id)
				: []
		: []

	const itemTracks = useMemo(() => {
		if (isTrack) return [item]
		else if (isAlbum && discs) return discs.flatMap((data) => data.data)
		else if (isPlaylist && tracks) return tracks
		else return []
	}, [isTrack, isAlbum, discs, isPlaylist, tracks])

	useEffect(() => trigger('impactLight'), [item?.Id])

	return (
		<ScrollView>
			<YGroup unstyled marginBottom={bottom}>
				<FavoriteContextMenuRow item={item} />

				{renderAddToQueueRow && <AddToQueueMenuRow tracks={itemTracks} />}

				{renderAddToPlaylistRow && <AddToPlaylistRow track={item} />}

				{renderViewAlbumRow && (
					<ViewAlbumMenuRow
						album={isAlbum ? item : album!}
						stackNavigation={stackNavigation}
					/>
				)}

				{!isPlaylist && (
					<ArtistMenuRows artistIds={artistIds} stackNavigation={stackNavigation} />
				)}
			</YGroup>
		</ScrollView>
	)
}

function AddToPlaylistRow({ track }: { track: BaseItemDto }): React.JSX.Element {
	return (
		<ListItem
			animation={'quick'}
			backgroundColor={'transparent'}
			flex={1}
			gap={'$2'}
			justifyContent='flex-start'
			onPress={() => {
				navigationRef.goBack()
				navigationRef.dispatch(StackActions.push('AddToPlaylist', { track }))
			}}
			pressStyle={{ opacity: 0.5 }}
		>
			<Icon small color='$primary' name='playlist-plus' />

			<Text bold>Add to Playlist</Text>
		</ListItem>
	)
}

function AddToQueueMenuRow({ tracks }: { tracks: BaseItemDto[] }): React.JSX.Element {
	const useAddToQueue = useAddToQueueContext()

	const mutation: AddToQueueMutation = {
		tracks,
		queuingType: QueuingType.DirectlyQueued,
	}

	return (
		<ListItem
			animation={'quick'}
			backgroundColor={'transparent'}
			flex={1}
			gap={'$2'}
			justifyContent='flex-start'
			onPress={() => {
				useAddToQueue.mutate(mutation)
			}}
			pressStyle={{ opacity: 0.5 }}
		>
			<Icon small color='$primary' name='music-note-plus' />

			<Text bold marginLeft={'$1'}>
				Add to Queue
			</Text>
		</ListItem>
	)
}

function BackgroundGradient(): React.JSX.Element {
	const themeSetting = useThemeSettingContext()

	const colorScheme = useColorScheme()

	const isDarkMode =
		(themeSetting === 'system' && colorScheme === 'dark') || themeSetting === 'dark'

	const gradientColors = isDarkMode
		? [getToken('$black'), getToken('$black75')]
		: [getToken('$lightTranslucent'), getToken('$lightTranslucent')]

	return <LinearGradient style={{ flex: 1 }} colors={gradientColors} />
}

interface MenuRowProps {
	album: BaseItemDto
	stackNavigation?: StackNavigation
}

function ViewAlbumMenuRow({ album: album, stackNavigation }: MenuRowProps): React.JSX.Element {
	const goToAlbum = useCallback(() => {
		if (stackNavigation && album) stackNavigation.navigate('Album', { album })
		else goToAlbumFromContextSheet(album)
	}, [album, stackNavigation, navigationRef])

	return (
		<ListItem
			animation='quick'
			backgroundColor={'transparent'}
			gap={'$3'}
			justifyContent='flex-start'
			onPress={goToAlbum}
			pressStyle={{ opacity: 0.5 }}
		>
			<ItemImage item={album} height={'$9'} width={'$9'} />

			<TextTicker {...TextTickerConfig}>
				<Text bold>{`Go to ${getItemName(album)}`}</Text>
			</TextTicker>
		</ListItem>
	)
}

function ArtistMenuRows({
	artistIds,
	stackNavigation,
}: {
	artistIds: (string | null | undefined)[]
	stackNavigation: StackNavigation | undefined
}): React.JSX.Element {
	return (
		<View>
			{artistIds.map((id) => (
				<ViewArtistMenuRow artistId={id} key={id} stackNavigation={stackNavigation} />
			))}
		</View>
	)
}

function ViewArtistMenuRow({
	artistId,
	stackNavigation,
}: {
	artistId: string | null | undefined
	stackNavigation: StackNavigation | undefined
}): React.JSX.Element {
	const { api } = useJellifyContext()

	const { data: artist } = useQuery({
		queryKey: [QueryKeys.ArtistById, artistId],
		queryFn: () => fetchItem(api, artistId!),
		enabled: !!artistId,
	})

	const goToArtist = useCallback(
		(artist: BaseItemDto) => {
			if (stackNavigation) stackNavigation.navigate('Artist', { artist })
			else goToArtistFromContextSheet(artist)
		},
		[stackNavigation, navigationRef],
	)

	return artist ? (
		<ListItem
			animation={'quick'}
			backgroundColor={'transparent'}
			gap={'$3'}
			justifyContent='flex-start'
			onPress={() => goToArtist(artist)}
			pressStyle={{ opacity: 0.5 }}
		>
			<ItemImage circular item={artist} height={'$9'} width={'$9'} />

			<Text bold>{`Go to ${getItemName(artist)}`}</Text>
		</ListItem>
	) : (
		<></>
	)
}
