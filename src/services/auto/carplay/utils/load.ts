import { fetchFrequentlyPlayed } from '../../../../api/queries/frequents/utils/frequents'
import { refreshUserPlaylists, refreshPlaylistTracks } from '../../../../api/queries/playlist/cache'
import { fetchRecentlyAdded, fetchRecentlyPlayed } from '../../../../api/queries/recents/utils'
import i18n from '../../../../i18n'
import { getApi, getUser, getLibrary } from '../../../../stores/auth/utils'
import { BaseItemKind, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import { CarPlayTemplate, CarPlayListSection } from 'react-native-nitro-player'
import { byLetter, playableItems, withMore } from '.'
import { titles, PAGE_SIZE, LETTERS, TRACK_FIELDS } from '../constants'
import home from '../home'
import { getItems } from './items'
import row from './row'
import { playableTracks, downloadedTracks, favoriteTracks } from './track'
import { problem, message, opens } from './events'

// The car shows whatever comes back, so errors become rows rather than an empty screen
export async function loadTemplate(templateId: string): Promise<CarPlayTemplate> {
	const sections = await load(templateId).catch((error): CarPlayListSection[] => {
		console.warn('CarPlay: request failed', error)
		return [{ items: [problem(error)] }]
	})
	return { type: 'list', id: templateId, title: titles.get(templateId) ?? '', sections }
}

async function load(templateId: string): Promise<CarPlayListSection[]> {
	const api = getApi()
	const user = getUser()
	const library = getLibrary()
	if (!api || !user) return [{ items: [message(i18n.t('car.signIn'))] }]

	const [base, offsetText] = templateId.split('@')
	const offset = Number(offsetText) || 0
	const separator = base.indexOf(':')
	const kind = separator < 0 ? base : base.slice(0, separator)
	const id = separator < 0 ? '' : base.slice(separator + 1)
	const musicLibraryId = library?.musicLibraryId
	const page = { startIndex: offset, limit: PAGE_SIZE + 1 }

	switch (kind) {
		case 'home':
			return home()
		case 'added': {
			const albums = (await fetchRecentlyAdded(api, library, 0)).filter(
				(item) => item.Type === BaseItemKind.MusicAlbum,
			)
			if (albums.length === 0) return [{ items: [message(i18n.t('car.empty'))] }]
			return [{ items: albums.map((album) => row('album', album)) }]
		}
		case 'artists':
		case 'albums':
			if (!id)
				return [
					{
						items: LETTERS.map((letter) => ({
							id: `${kind}:${letter}`,
							title: letter,
							template: opens(`${kind}:${letter}`, letter),
						})),
					},
				]
			return withMore(
				base,
				offset,
				kind === 'artists'
					? (
							await getItems({
								parentId: musicLibraryId,
								includeItemTypes: [BaseItemKind.MusicArtist],
								recursive: true,
								sortBy: [ItemSortBy.SortName],
								sortOrder: [SortOrder.Ascending],
								enableImages: true,
								...page,
								...byLetter(id),
							})
						).map((artist) => row('artist', artist))
					: (
							await getItems({
								parentId: musicLibraryId,
								includeItemTypes: [BaseItemKind.MusicAlbum],
								recursive: true,
								sortBy: [ItemSortBy.SortName],
								...page,
								...byLetter(id),
							})
						).map((album) => row('album', album)),
			)
		case 'artist':
			return withMore(
				base,
				offset,
				(
					await getItems({
						parentId: musicLibraryId,
						includeItemTypes: [BaseItemKind.MusicAlbum],
						recursive: true,
						albumArtistIds: [id],
						sortBy: [ItemSortBy.PremiereDate, ItemSortBy.SortName],
						sortOrder: [SortOrder.Descending],
						...page,
					})
				).map((album) => row('album', album)),
			)
		case 'playlists':
			return withMore(
				base,
				offset,
				(await refreshUserPlaylists())
					.slice(offset, offset + PAGE_SIZE + 1)
					.map((playlist) => row('playlist', playlist)),
			)
		case 'album':
			return playableItems(
				base,
				await getItems({
					parentId: id,
					includeItemTypes: [BaseItemKind.Audio],
					sortBy: [
						ItemSortBy.ParentIndexNumber,
						ItemSortBy.IndexNumber,
						ItemSortBy.SortName,
					],
					fields: TRACK_FIELDS,
				}),
			)
		case 'playlist':
			return playableItems(base, await refreshPlaylistTracks({ Id: id }))
		case 'picks':
			if (id === 'downloads') return playableTracks(base, await downloadedTracks())
			return playableItems(
				base,
				id === 'recents'
					? await fetchRecentlyPlayed(api, user, library, 0)
					: id === 'frequents'
						? await fetchFrequentlyPlayed(api, library, 0)
						: await favoriteTracks(musicLibraryId),
			)
		default:
			return []
	}
}
