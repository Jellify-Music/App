import { DeviceEventEmitter, NativeModules, Platform } from 'react-native'
import type { MediaItem } from 'react-native-nitro-player'
import { captureError, LoggingContext } from '../../utils/logging'

type LoadChildrenRequest = { requestId: string; parentId: string }

type SearchRequest = { requestId: string; query: string }

type AndroidAutoBrowseModule = {
	registerChildrenLoader: () => void
	resolveChildren: (requestId: string, itemsJson: string | null) => void
	registerSearchProvider: () => void
	resolveSearch: (requestId: string, itemsJson: string | null) => void
	setArtworkServer: (url: string | null) => void
	setFavoriteButton: (state: 'favorite' | 'not-favorite' | null) => void
}

const LOAD_CHILDREN_EVENT = 'JellifyAndroidAutoLoadChildren'
const SEARCH_EVENT = 'JellifyAndroidAutoSearch'
const CUSTOM_ACTION_EVENT = 'JellifyAndroidAutoCustomAction'

/**
 * Lets Android Auto load folders on demand: native asks for a folder's children,
 * `load` answers. A failing `load` answers with an empty list.
 */
export function registerChildrenLoader(load: (parentId: string) => Promise<MediaItem[]>): void {
	const module = NativeModules.JellifyAndroidAuto as AndroidAutoBrowseModule | undefined
	if (Platform.OS !== 'android' || !module) return

	DeviceEventEmitter.addListener(
		LOAD_CHILDREN_EVENT,
		async ({ requestId, parentId }: LoadChildrenRequest) => {
			let items: MediaItem[] = []
			try {
				items = await load(parentId)
			} catch (error) {
				captureError(
					error,
					LoggingContext.AndroidAuto,
					`Failed to load children for ${parentId}`,
				)
			}
			module.resolveChildren(requestId, JSON.stringify(items))
		},
	)

	module.registerChildrenLoader()
}

/**
 * Answers Android Auto's searches — typed in the car, and spoken ones the player cannot
 * answer from what is already loaded. A failing `search` answers with an empty list.
 */
export function registerSearchProvider(search: (query: string) => Promise<MediaItem[]>): void {
	const module = NativeModules.JellifyAndroidAuto as AndroidAutoBrowseModule | undefined
	if (Platform.OS !== 'android' || !module) return

	DeviceEventEmitter.addListener(SEARCH_EVENT, async ({ requestId, query }: SearchRequest) => {
		let items: MediaItem[] = []
		try {
			items = await search(query)
		} catch (error) {
			captureError(error, LoggingContext.AndroidAuto, 'Failed to search')
		}
		module.resolveSearch(requestId, JSON.stringify(items))
	})

	module.registerSearchProvider()
}

/** Tells the native artwork provider which Jellyfin server to fetch images from. */
export function setArtworkServer(url: string | undefined): void {
	const module = NativeModules.JellifyAndroidAuto as AndroidAutoBrowseModule | undefined
	if (Platform.OS !== 'android' || !module) return
	module.setArtworkServer(url ?? null)
}

/** Shows the heart next to the transport controls, filled for a favourite; `null` hides it. */
export function setFavoriteButton(isFavorite: boolean | null): void {
	const module = NativeModules.JellifyAndroidAuto as AndroidAutoBrowseModule | undefined
	if (Platform.OS !== 'android' || !module) return
	module.setFavoriteButton(isFavorite === null ? null : isFavorite ? 'favorite' : 'not-favorite')
}

/** Calls `handle` with the action of a pressed custom button (see {@link setFavoriteButton}). */
export function onCustomAction(handle: (action: string) => void): void {
	if (Platform.OS !== 'android') return
	DeviceEventEmitter.addListener(CUSTOM_ACTION_EVENT, ({ action }: { action: string }) =>
		handle(action),
	)
}
