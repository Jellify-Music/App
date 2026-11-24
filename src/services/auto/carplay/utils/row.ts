import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { CarPlayListItem } from 'react-native-nitro-player'
import { PLACEHOLDERS } from '../constants'
import { cover } from './cover'
import { opens } from './events'

export default function row(
	kind: 'artist' | 'album' | 'playlist',
	item: BaseItemDto,
): CarPlayListItem {
	const id = `${kind}:${item.Id}`
	return {
		id,
		title: item.Name ?? '',
		subtitle: kind === 'album' ? (item.AlbumArtist ?? undefined) : undefined,
		image: cover(item) ?? PLACEHOLDERS[kind],
		template: opens(id, item.Name ?? ''),
	}
}
