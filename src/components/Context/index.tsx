import { BaseItemDto, BaseItemKind, MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client'
import { YGroup } from 'tamagui'
import { StackNavigation } from '../../screens/types'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '../../enums/query-keys'
import { fetchAlbumDiscs } from '../../api/queries/item'
import { useEffect } from 'react'
import { getApi } from '../../stores/auth/utils'
import { useAlbum } from '../../api/queries/album'
import { usePlaylistTracks } from '../../api/queries/playlist'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { applyHapticFeedback } from '../../utils/haptics'
import { QueryAges } from '../../constants/durations'
import FavoriteContextMenuRow from './components/user-data'
import AddToQueueMenuRows from './components/queue'
import AddToPlaylistRow from './components/playlist/add-to-playlist-row'
import RemoveFromPlaylistRow from './components/playlist/remove-from-playlist-row'
import DeletePlaylistRow from './components/playlist/delete-playlist-row'
import DownloadMenuRow from './components/download'
import StatsMenuRow from './components/stats'
import ViewInstantMixMenuRow from './components/instant-mix'
import ViewAlbumMenuRow from './components/album'
import ArtistMenuRows from './components/artist'

interface ContextProps {
	item: BaseItemDto
	playlist?: BaseItemDto
	streamingMediaSourceInfo?: MediaSourceInfo
	downloadedMediaSourceInfo?: MediaSourceInfo
	stackNavigation?: StackNavigation
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
		gcTime: QueryAges.OneWeek,
	})

	const hasTracks = isTrack || (isAlbum && tracks) || (isPlaylist && tracks)

	const renderAddToPlaylistRow = isTrack || isAlbum

	const renderRemoveFromPlaylistRow = isTrack && !!playlist

	const viewAlbum = isAlbum ? item : isTrack ? album : undefined

	const renderDeletePlaylistRow = isPlaylist && item.CanDelete

	const renderInstantMixRow = isTrack || isAlbum || isArtist

	const artistIds = isPlaylist
		? []
		: isArtist
			? [item.Id]
			: (item.ArtistItems?.map((artist) => artist.Id) ?? [])

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
		<YGroup gap='2' marginBottom={bottom}>
			<FavoriteContextMenuRow item={item} />

			{hasTracks && <AddToQueueMenuRows tracks={itemTracks} />}

			{renderAddToPlaylistRow && (
				<AddToPlaylistRow tracks={itemTracks} source={isAlbum ? item : undefined} />
			)}

			{renderRemoveFromPlaylistRow && playlist && (
				<RemoveFromPlaylistRow track={item} playlist={playlist} />
			)}

			{hasTracks && <DownloadMenuRow items={itemTracks} />}

			{(streamingMediaSourceInfo || downloadedMediaSourceInfo) && (
				<StatsMenuRow
					item={item}
					streamingMediaSourceInfo={streamingMediaSourceInfo}
					downloadedMediaSourceInfo={downloadedMediaSourceInfo}
				/>
			)}

			{renderInstantMixRow && <ViewInstantMixMenuRow item={item} />}

			{viewAlbum && <ViewAlbumMenuRow album={viewAlbum} stackNavigation={stackNavigation} />}

			{!isPlaylist && (
				<ArtistMenuRows artistIds={artistIds} stackNavigation={stackNavigation} />
			)}

			{renderDeletePlaylistRow && <DeletePlaylistRow playlist={item} />}
		</YGroup>
	)
}
