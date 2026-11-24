import i18n from '../../../../i18n'
import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { CarPlayImageRow } from 'react-native-nitro-player'
import { titles, TILES, PLACEHOLDERS } from '../constants'
import toTracks from './track'
import carPlaylist from './playlist'
import { opens } from './events'
import { cover } from './cover'

// Song artwork wrapping like a grid; a song plays with the rest of the list after it
export async function songTiles(
	id: string,
	title: string,
	items: BaseItemDto[],
): Promise<CarPlayImageRow | undefined> {
	const found = await toTracks(items)
	if (found.length === 0) return undefined
	const { playlistId, tracks } = await carPlaylist(`home:${id}`, found)
	titles.set(id, title)
	return {
		type: 'imageRow',
		id,
		title,
		multipleLines: true,
		elements: tracks.slice(0, TILES).map((track, index) => ({
			id: `${playlistId}:${index}`,
			image: track.artwork ?? 'music.note',
			title: track.title,
			subtitle: track.artist,
			playlistId,
			trackId: track.id,
		})),
	}
}

export function albumTiles(items: BaseItemDto[]): CarPlayImageRow | undefined {
	const albums = items.filter((item) => item.Type === BaseItemKind.MusicAlbum)
	if (albums.length === 0) return undefined
	titles.set('added', i18n.t('car.recentlyAdded'))
	return {
		type: 'imageRow',
		id: 'added',
		title: i18n.t('car.recentlyAdded'),
		multipleLines: true,
		elements: albums.slice(0, TILES).map((album) => ({
			id: `album:${album.Id}`,
			image: cover(album) ?? PLACEHOLDERS.album,
			title: album.Name ?? '',
			subtitle: album.AlbumArtist ?? undefined,
			template: opens(`album:${album.Id}`, album.Name ?? ''),
		})),
	}
}
