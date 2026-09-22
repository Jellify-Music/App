import { DeviceEventEmitter, NativeModules, Platform } from 'react-native'
import type { MediaItem } from 'react-native-nitro-player'
import { captureError, LoggingContext } from '../../utils/logging'

type LoadChildrenRequest = { requestId: string; parentId: string }

type AndroidAutoBrowseModule = {
	registerChildrenLoader: () => void
	resolveChildren: (requestId: string, itemsJson: string | null) => void
	setArtworkServer: (url: string | null) => void
}

const LOAD_CHILDREN_EVENT = 'JellifyAndroidAutoLoadChildren'

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

/** Tells the native artwork provider which Jellyfin server to fetch images from. */
export function setArtworkServer(url: string | undefined): void {
	const module = NativeModules.JellifyAndroidAuto as AndroidAutoBrowseModule | undefined
	if (Platform.OS !== 'android' || !module) return
	module.setArtworkServer(url ?? null)
}
