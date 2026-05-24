import {
	BaseItemDto,
	BaseItemKind,
	MediaSourceInfo,
} from '@jellyfin/sdk/lib/generated-client/models'
import { ListItem, Paragraph, View, YGroup } from 'tamagui'
import { StackNavigation } from '../../screens/types'
import FavoriteContextMenuRow from '../Global/components/favorite-context-menu-row'
import Icon from '../Global/components/icon'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '../../enums/query-keys'
import { fetchAlbumDiscs } from '../../api/queries/item'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { AddToQueueMutation } from '../../hooks/player/interfaces'
import { QueuingType } from '../../enums/queuing-type'
import { useEffect } from 'react'
import navigationRef from '../../screens/navigation'
import { getItemName } from '../../utils/formatting/item-names'
import ItemImage from '../Global/components/image'
import { StackActions } from '@react-navigation/native'
import TextTicker from 'react-native-text-ticker'
import { TextTickerConfig } from '../Player/component.config'
import { getApi } from '../../stores/auth/utils'
import DeletePlaylistRow from './components/delete-playlist-row'
import RemoveFromPlaylistRow from './components/remove-from-playlist-row'
import useDownloadTracks, { useDeleteDownloads } from '../../hooks/downloads/mutations'
import { useAreAllDownloaded } from '../../hooks/downloads'
import { useDownloadProgress } from 'react-native-nitro-player'
import CircularProgressIndicator from '../Global/components/circular-progress-indicator'
import { useArtist } from '../../api/queries/artist'
import { addToQueue } from '../../hooks/player/functions/queue'
import { useAlbum } from '../../api/queries/album'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Presets } from 'react-native-pulsar'
import ViewInstantMixMenuRow from './components/instant-mix-row'
import { ICON_PRESS_STYLES } from '../../configs/style.config'
import goToScreenFromContextSheet from './utils/navigation'

interface ContextProps {
	item: BaseItemDto
	playlist?: BaseItemDto
	streamingMediaSourceInfo?: MediaSourceInfo
	downloadedMediaSourceInfo?: MediaSourceInfo
	stackNavigation?: StackNavigation
	navigationCallback?: (screen: 'Album' | 'Artist', item: BaseItemDto) => void
}

export default function ItemContext({
	item,
	playlist,
	streamingMediaSourceInfo,
	downloadedMediaSourceInfo,
	stackNavigation,
}: ContextProps): React.JSX.Element {
	const api = getApi()

	const { bottom } = useSafeAreaInsets()

	const isArtist = item.Type === BaseItemKind.MusicArtist
	const isAlbum = item.Type === BaseItemKind.MusicAlbum
	const isTrack = item.Type === BaseItemKind.Audio
	const isPlaylist = item.Type === BaseItemKind.Playlist

	const { data: album } = useAlbum(
		isTrack && item.AlbumId ? ({ Id: item.AlbumId } as BaseItemDto) : ({} as BaseItemDto),
	)

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

	const renderAddToPlaylistRow = isTrack || isAlbum

	const renderRemoveFromPlaylistRow = isTrack && !!playlist

	const renderViewAlbumRow = isAlbum || (isTrack && album)

	const renderDeletePlaylistRow = isPlaylist && item.CanDelete

	const renderInstantMaxRow = isTrack || isAlbum || isArtist

	const artistIds = !isPlaylist
		? isArtist
			? [item.Id]
			: item.ArtistItems
				? item.ArtistItems.map((item) => item.Id)
				: []
		: []

	const itemTracks = (() => {
		if (isTrack) return [item]
		else if (isAlbum && discs) return discs.flatMap((data) => data.data)
		else if (isPlaylist && tracks) return tracks
		else return []
	})()

	useEffect(() => {
		Presets.peck()
	}, [item?.Id])

	return (
		<YGroup marginBottom={bottom}>
			<FavoriteContextMenuRow item={item} />

			{renderDeletePlaylistRow && <DeletePlaylistRow playlist={item} />}

			{renderAddToQueueRow && <AddToQueueMenuRow tracks={itemTracks} />}

			{renderAddToPlaylistRow && (
				<AddToPlaylistRow
					tracks={isAlbum && discs ? discs.flatMap((d) => d.data) : [item]}
					source={isAlbum ? item : undefined}
				/>
			)}

			{renderAddToQueueRow && <DownloadMenuRow items={itemTracks} />}

			{renderRemoveFromPlaylistRow && playlist && (
				<RemoveFromPlaylistRow track={item} playlist={playlist} />
			)}

			{(streamingMediaSourceInfo || downloadedMediaSourceInfo) && (
				<StatsRow
					item={item}
					streamingMediaSourceInfo={streamingMediaSourceInfo}
					downloadedMediaSourceInfo={downloadedMediaSourceInfo}
				/>
			)}

			{renderInstantMaxRow && <ViewInstantMixMenuRow item={item} />}

			{renderViewAlbumRow && ((isAlbum && item) || (isTrack && album)) && (
				<ViewAlbumMenuRow
					album={isAlbum ? item : album!}
					stackNavigation={stackNavigation}
				/>
			)}

			{!isPlaylist && (
				<ArtistMenuRows artistIds={artistIds} stackNavigation={stackNavigation} />
			)}
		</YGroup>
	)
}

function AddToPlaylistRow({
	tracks,
	source,
}: {
	tracks: BaseItemDto[]
	source?: BaseItemDto
}): React.JSX.Element {
	return (
		<ListItem
			backgroundColor={'transparent'}
			flex={1}
			gap={'$2.5'}
			justifyContent='flex-start'
			onPress={() => {
				navigationRef.goBack()
				navigationRef.dispatch(
					StackActions.push('AddToPlaylist', {
						tracks,
						source,
					}),
				)
			}}
			{...ICON_PRESS_STYLES}
		>
			<Icon small color='$primary' name='plus-circle-outline' />

			<Paragraph fontWeight={'$6'}>Add to Playlist</Paragraph>
		</ListItem>
	)
}

function AddToQueueMenuRow({ tracks }: { tracks: BaseItemDto[] }): React.JSX.Element {
	const mutation: AddToQueueMutation = {
		tracks,
	}

	return (
		<>
			<ListItem
				backgroundColor={'transparent'}
				flex={1}
				gap={'$2.5'}
				justifyContent='flex-start'
				onPress={async () => {
					await addToQueue({
						...mutation,
						queuingType: QueuingType.PlayNext,
					})
				}}
				{...ICON_PRESS_STYLES}
			>
				{/* Use same icon as swipe Add to Queue for consistency */}
				<Icon small color='$primary' name='playlist-play' />

				<Paragraph fontWeight={'$6'}>Play Next</Paragraph>
			</ListItem>

			<ListItem
				backgroundColor={'transparent'}
				flex={1}
				gap={'$2.5'}
				justifyContent='flex-start'
				onPress={() => {
					addToQueue({
						...mutation,
						queuingType: QueuingType.PlayLater,
					})
				}}
				{...ICON_PRESS_STYLES}
			>
				{/* Consistent Add to Queue icon */}
				<Icon small color='$primary' name='playlist-play' />

				<Paragraph fontWeight={'$6'}>Add to Queue</Paragraph>
			</ListItem>
		</>
	)
}

function DownloadMenuRow({ items }: { items: BaseItemDto[] }): React.JSX.Element {
	const { mutate: download } = useDownloadTracks()

	const { overallProgress } = useDownloadProgress({
		trackIds: items.map((item) => item.Id!),
		activeOnly: true,
	})

	const isDownloading = overallProgress > 0 && overallProgress < 1

	const isDownloaded = useAreAllDownloaded(items.map((item) => item.Id))

	const removeDownloads = useDeleteDownloads()

	const handleRemoveDownloads = () => removeDownloads.mutate(items.map((item) => item.Id!))

	const currentlyDownloading = (
		<ListItem
			disabled
			backgroundColor={'transparent'}
			gap={'$4'}
			justifyContent='flex-start'
			{...ICON_PRESS_STYLES}
		>
			<CircularProgressIndicator progress={overallProgress} size={24} strokeWidth={4} />

			<Paragraph fontWeight={'$6'} color={'$borderColor'}>
				Download Queued
			</Paragraph>
		</ListItem>
	)

	const downloadListItem = (
		<ListItem
			backgroundColor={'transparent'}
			gap={'$2.5'}
			justifyContent='flex-start'
			onPress={() => download(items)}
			{...ICON_PRESS_STYLES}
		>
			<Icon
				small
				color='$primary'
				name={items.length > 1 ? 'download-multiple' : 'download'}
			/>

			<Paragraph fontWeight={'$6'}>Download</Paragraph>
		</ListItem>
	)

	const removeDownloadsListItem = (
		<ListItem
			backgroundColor={'transparent'}
			gap={'$2.5'}
			justifyContent='flex-start'
			onPress={handleRemoveDownloads}
			{...ICON_PRESS_STYLES}
		>
			<Icon small color='$warning' name='broom' />

			<Paragraph fontWeight={'$6'}>Remove Download</Paragraph>
		</ListItem>
	)

	return !isDownloaded && !isDownloading
		? downloadListItem
		: !isDownloaded && isDownloading
			? currentlyDownloading
			: removeDownloadsListItem
}

interface MenuRowProps {
	album: BaseItemDto
	stackNavigation?: StackNavigation
}

function ViewAlbumMenuRow({ album: album, stackNavigation }: MenuRowProps): React.JSX.Element {
	const goToAlbum = () => {
		if (stackNavigation && album) stackNavigation.navigate('Album', { album })
		else goToScreenFromContextSheet('Album', { album })
	}

	return (
		<ListItem
			backgroundColor={'transparent'}
			gap={'$3'}
			justifyContent='flex-start'
			onPress={goToAlbum}
			{...ICON_PRESS_STYLES}
		>
			<ItemImage
				item={album}
				height={'$9'}
				width={'$9'}
				imageOptions={{ maxWidth: 140, maxHeight: 140, quality: 100 }}
			/>

			<TextTicker {...TextTickerConfig}>
				<Paragraph fontWeight={'$6'}>{`Go to ${getItemName(album)}`}</Paragraph>
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
	const api = getApi()

	const { data: artist } = useArtist(artistId)

	const goToArtist = (artist: BaseItemDto) => {
		if (stackNavigation) stackNavigation.navigate('Artist', { artist })
		else goToScreenFromContextSheet('Artist', { artist })
	}

	return artist ? (
		<ListItem
			backgroundColor={'transparent'}
			gap={'$3'}
			justifyContent='flex-start'
			onPress={() => goToArtist(artist)}
			{...ICON_PRESS_STYLES}
		>
			<ItemImage
				circular
				item={artist}
				height={'$9'}
				width={'$9'}
				imageOptions={{ maxWidth: 140, maxHeight: 140, quality: 100 }}
			/>

			<Paragraph fontWeight={'$6'}>{`Go to ${getItemName(artist)}`}</Paragraph>
		</ListItem>
	) : (
		<></>
	)
}

function StatsRow({
	item,
	streamingMediaSourceInfo,
	downloadedMediaSourceInfo,
}: {
	item: BaseItemDto
	streamingMediaSourceInfo?: MediaSourceInfo
	downloadedMediaSourceInfo?: MediaSourceInfo
}): React.JSX.Element {
	return (
		<ListItem
			backgroundColor={'transparent'}
			gap={'$2.5'}
			justifyContent='flex-start'
			onPress={() => {
				navigationRef.goBack() // dismiss context modal
				navigationRef.navigate('AudioSpecs', {
					item,
					streamingMediaSourceInfo,
					downloadedMediaSourceInfo,
				})
			}}
			{...ICON_PRESS_STYLES}
		>
			<Icon small name='sine-wave' color='$primary' />

			<Paragraph fontWeight={'$6'}>Open Audio Specs</Paragraph>
		</ListItem>
	)
}
