import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import formatTrackName from './track-names'
import i18n from '../../i18n'

export function getItemName(item: BaseItemDto): string {
	console.debug(item)
	if (item.Type === BaseItemKind.Audio) return formatTrackName(item)
	else return item.Name ?? item.OriginalTitle ?? getUnknownItemName(item)
}

function getUnknownItemName(item: BaseItemDto): string {
	switch (item.Type) {
		case BaseItemKind.MusicArtist:
			return i18n.t('placeholders.unknownArtist')
		case BaseItemKind.MusicAlbum:
			return i18n.t('placeholders.unknownAlbum')
		case BaseItemKind.Audio:
			return i18n.t('placeholders.unknownTrack')
		case BaseItemKind.Playlist:
			return i18n.t('placeholders.unknownPlaylist')
		case BaseItemKind.Genre:
		case BaseItemKind.MusicGenre:
			return i18n.t('placeholders.unknownGenre')
		case BaseItemKind.MusicVideo:
			return i18n.t('placeholders.unknownMusicVideo')
		default:
			return i18n.t('placeholders.unknownItem')
	}
}
