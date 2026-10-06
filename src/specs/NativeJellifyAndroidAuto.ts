import type { CodegenTypes, TurboModule } from 'react-native'
import { TurboModuleRegistry } from 'react-native'

/** A folder Android Auto opened that isn't in the published tree. */
export type LoadChildrenRequest = { requestId: string; parentId: string }

/** A search typed in the car, or spoken and not answerable from the loaded playlists. */
export type SearchRequest = { requestId: string; query: string }

/** A press on one of the session buttons (the heart). */
export type CustomActionEvent = { action: string }

export interface Spec extends TurboModule {
	/** Starts answering `onLoadChildren` through {@link resolveChildren}. */
	registerChildrenLoader(): void
	resolveChildren(requestId: string, itemsJson: string | null): void

	/** Starts answering `onSearch` through {@link resolveSearch}. */
	registerSearchProvider(): void
	resolveSearch(requestId: string, itemsJson: string | null): void

	/** The Jellyfin server the artwork provider fetches images from. */
	setArtworkServer(url: string | null): void

	/** "favorite" (filled heart), "not-favorite", or null to hide it. */
	setFavoriteButton(state: string | null): void

	/** Shows or hides the "New shuffle" button beside the heart. */
	setShuffleButton(visible: boolean): void

	readonly onLoadChildren: CodegenTypes.EventEmitter<LoadChildrenRequest>
	readonly onSearch: CodegenTypes.EventEmitter<SearchRequest>
	readonly onCustomAction: CodegenTypes.EventEmitter<CustomActionEvent>
}

export default TurboModuleRegistry.get<Spec>('JellifyAndroidAuto')
