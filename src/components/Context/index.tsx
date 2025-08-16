import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { getToken, ListItem, View, YGroup, ZStack } from 'tamagui'
import { BaseStackParamList, RootStackParamList } from '../../screens/types'
import { Text } from '../Global/helpers/text'
import FavoriteContextMenuRow from '../Global/components/favorite-context-menu-row'
import { Blurhash } from 'react-native-blurhash'
import { getPrimaryBlurhashFromDto } from '../../utils/blurhash'
import { useColorScheme } from 'react-native'
import { useThemeSettingContext } from '../../providers/Settings'
import LinearGradient from 'react-native-linear-gradient'
import Icon from '../Global/components/icon'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '../../enums/query-keys'
import { fetchItem, fetchItems } from '../../api/queries/item'
import { useJellifyContext } from '../../providers'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { useAddToQueueContext } from '../../providers/Player/queue'
import { AddToQueueMutation } from '../../providers/Player/interfaces'
import { QueuingType } from '../../enums/queuing-type'
import { useCallback, useMemo } from 'react'
import navigationRef from '../../../navigation'
import { goToAlbumFromContextSheet, goToArtistFromContextSheet } from './utils/navigation'
import { getItemName } from '../../utils/text'
import ItemImage from '../Global/components/image'
import { StackActions } from '@react-navigation/native'
import TextTicker from 'react-native-text-ticker'
import { TextTickerConfig } from '../Player/component.config'

type StackNavigation = Pick<NativeStackNavigationProp<BaseStackParamList>, 'navigate' | 'dispatch'>

interface ContextProps {
	item: BaseItemDto
	stackNavigation?: StackNavigation
	navigation: NativeStackNavigationProp<RootStackParamList>
	navigationCallback?: (screen: 'Album' | 'Artist', item: BaseItemDto) => void
}

export default function ItemContext({ item, stackNavigation }: ContextProps): React.JSX.Element {
	const { api, user, library } = useJellifyContext()

	const isArtist = item.Type === BaseItemKind.MusicArtist
	const isAlbum = item.Type === BaseItemKind.MusicAlbum
	const isTrack = item.Type === BaseItemKind.Audio
	const isPlaylist = item.Type === BaseItemKind.Playlist

	const itemArtists = item.ArtistItems ?? []

	const { data: album } = useQuery({
		queryKey: [QueryKeys.Item, item.AlbumId],
		queryFn: () => fetchItem(api, item.AlbumId!),
		enabled: isTrack,
	})

	const { data: artists } = useQuery({
		queryKey: [
			QueryKeys.ArtistById,
			itemArtists.length > 0 ? itemArtists?.map((artist) => artist.Id) : item.Id,
		],
		queryFn: () =>
			fetchItems(
				api,
				user,
				library,
				[BaseItemKind.MusicArtist],
				0,
				[],
				[],
				undefined,
				undefined,
				itemArtists?.map((artist) => artist.Id!),
			),
		enabled: (isTrack || isAlbum) && itemArtists.length > 0,
		select: (data) => data.data,
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
	})

	const renderAddToQueueRow = isTrack || (isAlbum && tracks) || (isPlaylist && tracks)

	const renderAddToPlaylistRow = isTrack

	const renderViewAlbumRow = useMemo(() => isAlbum || (isTrack && album), [album, item])

	return (
		<ZStack animation={'quick'}>
			<ItemContextBackground item={item} />

			<YGroup unstyled flex={1} marginTop={'$8'}>
				<FavoriteContextMenuRow item={item} />

				{renderAddToQueueRow && <AddToQueueMenuRow tracks={isTrack ? [item] : tracks!} />}

				{renderAddToPlaylistRow && <AddToPlaylistRow track={item} />}

				{renderViewAlbumRow && (
					<ViewAlbumMenuRow
						album={isAlbum ? item : album!}
						stackNavigation={stackNavigation}
					/>
				)}

				{!isPlaylist && (
					<ViewArtistMenuRow
						artists={isArtist ? [item] : artists ? artists : []}
						stackNavigation={stackNavigation}
					/>
				)}
			</YGroup>
		</ZStack>
	)
}

function ItemContextBackground({ item }: { item: BaseItemDto }): React.JSX.Element {
	return (
		<ZStack flex={1}>
			<BackgroundBlur item={item} />

			<BackgroundGradient />
		</ZStack>
	)
}

function BackgroundBlur({ item }: { item: BaseItemDto }): React.JSX.Element {
	const blurhash = getPrimaryBlurhashFromDto(item)

	return (
		<Blurhash
			blurhash={blurhash!}
			style={{
				flex: 1,
			}}
		/>
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
			<Icon color='$primary' name='playlist-plus' />

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
			<Icon color='$primary' name='music-note-plus' />

			<Text bold>Add to Queue</Text>
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
			<ItemImage item={album} height={'$10'} width={'$10'} />

			<TextTicker {...TextTickerConfig}>
				<Text bold>{`Go to ${getItemName(album)}`}</Text>
			</TextTicker>
		</ListItem>
	)
}

function ViewArtistMenuRow({
	artists,
	stackNavigation,
}: {
	artists: BaseItemDto[]
	stackNavigation: StackNavigation | undefined
}): React.JSX.Element {
	const goToArtist = useCallback(
		(artist: BaseItemDto) => {
			if (stackNavigation) stackNavigation.navigate('Artist', { artist })
			else goToArtistFromContextSheet(artist)
		},
		[stackNavigation, navigationRef],
	)

	return (
		<View>
			{artists.map((artist, index) => (
				<ListItem
					animation={'quick'}
					backgroundColor={'transparent'}
					gap={'$3'}
					justifyContent='flex-start'
					key={index}
					onPress={() => goToArtist(artist)}
					pressStyle={{ opacity: 0.5 }}
				>
					<ItemImage circular item={artist} height={'$10'} width={'$10'} />

					<Text bold>{`Go to ${getItemName(artist)}`}</Text>
				</ListItem>
			))}
		</View>
	)
}
