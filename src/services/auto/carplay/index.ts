import { Platform } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import { CarPlayHelper, PlayerQueue, TrackPlayer } from 'react-native-nitro-player'
import useJellifyStore from '../../../stores/auth'
import { useAutoStore } from '../../../stores/auto'
import getTrackDto from '../../../utils/mapping/track-extra-payload'
import { AA_PLAYLIST_NAME_PREFIX } from '../android-auto'
import i18n from '../../../i18n'
import { RETRY_ID, TABS, titles } from './constants'
import { loadTemplate } from './utils/load'
import { opens } from './utils/events'

/** Deletes car playlists from earlier sessions, keeping the one that may be playing. */
async function deleteStaleCarPlaylists(): Promise<void> {
	const { currentPlaylistId } = await TrackPlayer.getState()
	const stale = PlayerQueue.getAllPlaylists().filter(
		(p) => p.name.startsWith(AA_PLAYLIST_NAME_PREFIX) && p.id !== currentPlaylistId,
	)
	await Promise.all(stale.map((p) => PlayerQueue.deletePlaylist(p.id).catch(() => undefined)))
}

let isRegistered = false

/** Loads the open CarPlay lists again, keeping what is on screen until the new content arrives. */
export function refreshCarPlayLibrary(templateId?: string): void {
	if (isRegistered) CarPlayHelper.reload(templateId)
}

/**
 * Registers the CarPlay templates. react-native-nitro-player keeps them across launches
 * and starts JS when the car connects, so the car can start Jellify with the app closed.
 *
 * @returns A clean-up function
 */
export function registerCarPlayService() {
	if (Platform.OS !== 'ios' || !CarPlayHelper.isAvailable() || isRegistered) return () => {}
	isRegistered = true

	CarPlayHelper.set({
		templates: TABS,
		nowPlaying: { upNextTitle: i18n.t('car.queue'), albumArtist: true },
	})
	CarPlayHelper.setTemplateLoader(loadTemplate)
	CarPlayHelper.onSelect((id, templateId) => {
		if (id === RETRY_ID) CarPlayHelper.reload(templateId)
		// The title of an artwork row on Home opens its whole list
		else if (id.startsWith('picks:') || id === 'added')
			CarPlayHelper.push(opens(id, titles.get(id) ?? ''))
	})
	CarPlayHelper.onAlbumArtistPress((track) => {
		const item = getTrackDto(track)
		const artist = item?.ArtistItems?.[0]
		if (item?.AlbumId) CarPlayHelper.push(opens(`album:${item.AlbumId}`, track.album ?? ''))
		else if (artist?.Id) CarPlayHelper.push(opens(`artist:${artist.Id}`, artist.Name ?? ''))
	})

	const unsubscribeConnection = CarPlayHelper.onConnectionChange((connected) =>
		useAutoStore.getState().setIsConnected(connected),
	)
	useAutoStore.getState().setIsConnected(CarPlayHelper.isConnected())

	// Failed or signed-out lists recover on their own once the cause goes away
	let wasReachable = true
	const unsubscribeNetInfo = NetInfo.addEventListener(({ isInternetReachable }) => {
		if (isInternetReachable === false) wasReachable = false
		else if (isInternetReachable && !wasReachable) {
			wasReachable = true
			refreshCarPlayLibrary()
		}
	})
	const unsubscribeStore = useJellifyStore.subscribe((state, previous) => {
		if (
			state.user !== previous.user ||
			state.server !== previous.server ||
			state.library !== previous.library
		)
			refreshCarPlayLibrary()
	})

	deleteStaleCarPlaylists()

	return () => {
		unsubscribeConnection()
		unsubscribeNetInfo()
		unsubscribeStore()
	}
}
