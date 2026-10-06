import { Platform } from 'react-native'
import type { MediaItem } from 'react-native-nitro-player'
import NativeJellifyAndroidAuto from '../../specs/NativeJellifyAndroidAuto'
import { captureError, LoggingContext } from '../../utils/logging'

/** The native module, or `null` off Android (and wherever it isn't linked). */
const native = () => (Platform.OS === 'android' ? NativeJellifyAndroidAuto : null)

/**
 * Lets Android Auto load folders on demand: native asks for a folder's children,
 * `load` answers. A failing `load` answers with an empty list.
 */
export function registerChildrenLoader(load: (parentId: string) => Promise<MediaItem[]>): void {
	const module = native()
	if (!module) return

	module.onLoadChildren(async ({ requestId, parentId }) => {
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
	})

	module.registerChildrenLoader()
}

/**
 * Answers Android Auto's searches — typed in the car, and spoken ones the player cannot
 * answer from what is already loaded. A failing `search` answers with an empty list.
 */
export function registerSearchProvider(search: (query: string) => Promise<MediaItem[]>): void {
	const module = native()
	if (!module) return

	module.onSearch(async ({ requestId, query }) => {
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
	native()?.setArtworkServer(url ?? null)
}

/** Shows the heart next to the transport controls, filled for a favourite; `null` hides it. */
export function setFavoriteButton(isFavorite: boolean | null): void {
	native()?.setFavoriteButton(
		isFavorite === null ? null : isFavorite ? 'favorite' : 'not-favorite',
	)
}

/** Shows or hides the "New shuffle" button beside the heart. */
export function setShuffleButton(visible: boolean): void {
	native()?.setShuffleButton(visible)
}

/** Calls `handle` with the action of a pressed custom button (see {@link setFavoriteButton}). */
export function onCustomAction(handle: (action: string) => void): void {
	native()?.onCustomAction(({ action }) => handle(action))
}
