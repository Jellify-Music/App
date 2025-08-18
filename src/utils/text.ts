import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'

export function getItemName(item: BaseItemDto): string {
	return item.Name ?? item.OriginalTitle ?? `Unknown ${getItemNamePlaceholder(item)}`
}

function getItemNamePlaceholder(item: BaseItemDto): string {
	switch (item.Type) {
		case BaseItemKind.MusicArtist:
			return 'Artist'
		case BaseItemKind.MusicAlbum:
			return 'Album'
		case BaseItemKind.Audio:
			return 'Track'
		case BaseItemKind.Playlist:
			return 'Playlist'
		case BaseItemKind.Genre:
		case BaseItemKind.MusicGenre:
			return 'Genre'
		case BaseItemKind.MusicVideo:
			return 'Music Video'
		default:
			return 'Item'
	}
}
