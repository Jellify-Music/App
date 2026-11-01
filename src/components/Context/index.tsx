import {
	BaseItemDto,
	BaseItemKind,
	MediaSourceInfo,
} from '@jellyfin/sdk/lib/generated-client/models'
import { ListItem, SizableText, View, YGroup } from 'tamagui'
import { StackNavigation } from '../../screens/types'
import FavoriteContextMenuRow from './components/favorite-row'
import Icon from '../Global/components/icon'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '../../enums/query-keys'
import { fetchAlbumDiscs } from '../../api/queries/item'
import { AddToQueueMutation } from '../../player/interfaces'
import { QueuingType } from '../../enums/queuing-type'
import { useEffect } from 'react'
import navigationRef from '../../screens/navigation'
import { getItemName } from '../../utils/formatting/item-names'
import ItemImage from '../Global/components/image'
import { Ticker } from '../../components/Global/helpers/Animated/text'
import { getApi } from '../../stores/auth/utils'
import DeletePlaylistRow from './components/playlist/delete-playlist-row'
import RemoveFromPlaylistRow from './components/playlist/remove-from-playlist-row'
import useDownloadTracks, { useDeleteDownloads } from '../../hooks/downloads/mutations'
import { useAreAllDownloaded } from '../../hooks/downloads'
import { useDownloadProgress } from 'react-native-nitro-player'
import CircularProgressIndicator from '../Global/components/DownloadIndicator/circular-progress-indicator'
import { useArtist } from '../../api/queries/artist'
import { addToQueue } from '../../player/queuing'
import { useAlbum } from '../../api/queries/album'
import { usePlaylistTracks } from '../../api/queries/playlist'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ViewInstantMixMenuRow from './components/instant-mix-row'
import { ICON_PRESS_STYLES } from '../../configs/styling/elements'
import goToScreenFromContextSheet from './utils/navigation'
import { applyHapticFeedback } from '../../utils/haptics'
import AddToPlaylistRow from './components/playlist/add-to-playlist-row'

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

	const { data: tracks } = usePlaylistTracks(item, !isPlaylist)

	const { data: discs } = useQuery({
		queryKey: [QueryKeys.ItemTracks, item.Id],
		queryFn: ({ signal }) => fetchAlbumDiscs(api, item, signal),
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
		applyHapticFeedback('info')
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

function AddToQueueMenuRow({ tracks }: { tracks: BaseItemDto[] }): React.JSX.Element {
	const mutation: AddToQueueMutation = {
		tracks,
	}

	return (
		<>
			<ListItem
				backgroundColor={'transparent'}
				flex={1}
				gap='3'
				justifyContent='flex-start'
				{...ICON_PRESS_STYLES}
				onPress={async () => {
					await addToQueue({
						...mutation,
						queuingType: QueuingType.PlayNext,
					})
				}}
			>
				{/* Use same icon as swipe Add to Queue for consistency */}
				<Icon size={'7'} color='primary' name='playlist-play' />

				<SizableText fontSize={'3'} fontWeight='6'>
					Play Next
				</SizableText>
			</ListItem>

			<ListItem
				backgroundColor={'transparent'}
				flex={1}
				gap='3'
				justifyContent='flex-start'
				{...ICON_PRESS_STYLES}
				onPress={() => {
					addToQueue({
						...mutation,
						queuingType: QueuingType.PlayLater,
					})
				}}
			>
				{/* Consistent Add to Queue icon */}
				<Icon size={'7'} color='primary' name='playlist-play' />

				<SizableText fontSize={'3'} fontWeight='6'>
					Add to Queue
				</SizableText>
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
			gap='3'
			justifyContent='flex-start'
			{...ICON_PRESS_STYLES}
		>
			<CircularProgressIndicator progress={overallProgress} size={24} strokeWidth={4} />

			<SizableText fontSize={'3'} fontWeight='6' color='borderColor'>
				Download Queued
			</SizableText>
		</ListItem>
	)

	const downloadListItem = (
		<ListItem
			backgroundColor={'transparent'}
			gap='3'
			justifyContent='flex-start'
			{...ICON_PRESS_STYLES}
			onPress={() => download(items)}
		>
			<Icon
				size={'7'}
				color='primary'
				name={items.length > 1 ? 'download-multiple' : 'download'}
			/>

			<SizableText fontSize={'3'} fontWeight='6'>
				Download
			</SizableText>
		</ListItem>
	)

	const removeDownloadsListItem = (
		<ListItem
			backgroundColor={'transparent'}
			gap='3'
			justifyContent='flex-start'
			{...ICON_PRESS_STYLES}
			onPress={handleRemoveDownloads}
		>
			<Icon size={'7'} color='warning' name='broom' />

			<SizableText fontSize={'3'} fontWeight='6'>
				Remove Download
			</SizableText>
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
			gap='3'
			justifyContent='flex-start'
			{...ICON_PRESS_STYLES}
			onPress={goToAlbum}
		>
			<ItemImage
				item={album}
				height={'2'}
				width={'2'}
				imageOptions={{ maxWidth: 50, maxHeight: 50, quality: 100 }}
			/>

			<Ticker>
				<SizableText
					fontSize={'3'}
					fontWeight='6'
				>{`Go to ${getItemName(album)}`}</SizableText>
			</Ticker>
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
	const { data: artist } = useArtist(artistId)

	const goToArtist = (artist: BaseItemDto) => {
		if (stackNavigation) stackNavigation.navigate('Artist', { artist })
		else goToScreenFromContextSheet('Artist', { artist })
	}

	return artist ? (
		<ListItem
			backgroundColor={'transparent'}
			gap='3'
			justifyContent='flex-start'
			{...ICON_PRESS_STYLES}
			onPress={() => goToArtist(artist)}
		>
			<ItemImage
				circular
				item={artist}
				height={'2'}
				width={'2'}
				imageOptions={{ maxWidth: 50, maxHeight: 50, quality: 100 }}
			/>

			<SizableText
				fontSize={'3'}
				fontWeight='6'
			>{`Go to ${getItemName(artist)}`}</SizableText>
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
			gap='3'
			justifyContent='flex-start'
			{...ICON_PRESS_STYLES}
			onPress={() => {
				navigationRef.goBack() // dismiss context modal
				navigationRef.navigate('AudioSpecs', {
					item,
					streamingMediaSourceInfo,
					downloadedMediaSourceInfo,
				})
			}}
		>
			<Icon size={'7'} name='sine-wave' color='primary' />

			<SizableText fontSize={'3'} fontWeight='6'>
				Open Audio Specs
			</SizableText>
		</ListItem>
	)
}
