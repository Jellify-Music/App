import { CarPlayListTemplate } from 'react-native-nitro-player'
import i18n from '../../../i18n'
import { ItemFields } from '@jellyfin/sdk/lib/generated-client'

function tab(id: string, title: string, image: string): CarPlayListTemplate {
	return { type: 'list', id, title, lazy: true, tab: { title, image } }
}

// Lazy tabs show at once on a start from the car and fill in once JS is up
export const TABS: CarPlayListTemplate[] = [
	tab('home', i18n.t('navigation.home'), 'house.fill'),
	tab('artists', i18n.t('car.artists'), 'music.mic'),
	tab('albums', i18n.t('car.albums'), 'square.stack.fill'),
	tab('playlists', i18n.t('car.playlists'), 'music.note.list'),
]

/**
 * Titles of lists that can be opened, so their i18n.t('car.more') pages keep the name
 */
export const titles = new Map(TABS.map((template) => [template.id, template.title]))

export const PLACEHOLDERS = {
	artist: 'music.mic',
	album: 'square.stack',
	playlist: 'music.note.list',
}

export const LETTERS = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']
export const TILE_LIMIT = 500
export const PAGE_SIZE = 100
export const TRACK_FIELDS = [ItemFields.MediaSources, ItemFields.ParentId, ItemFields.Path]
export const RETRY_ID = 'retry'
export const TILES = 8
