import { BaseItemDto, BaseItemKind, ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { MediaLibrary, MediaItem, LayoutType, MediaType } from 'react-native-sportscar'
import { Api } from '@jellyfin/sdk/lib/api'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { getItemImageUrl } from '../../api/queries/image/utils'

/**
 * Configuration options for the MediaLibraryConverter
 */
export interface MediaLibraryConverterConfig {
	/** Default layout type for folders */
	defaultLayoutType?: LayoutType
	/** API instance for generating image URLs */
	api?: Api
	/** App name to display in Android Auto */
	appName?: string
	/** App icon URL for Android Auto */
	appIconUrl?: string
	/** Whether to include metadata in MediaItems */
	includeMetadata?: boolean
	/** Custom image type to use for artwork */
	imageType?: ImageType
}

/**
 * Converts Jellyfin BaseItemDto array to Android Auto MediaLibrary format
 */
export class MediaLibraryConverter {
	private config: Required<MediaLibraryConverterConfig>

	constructor(config: MediaLibraryConverterConfig = {}) {
		this.config = {
			defaultLayoutType: 'list',
			api: config.api || ({} as Api),
			appName: 'Jellify',
			appIconUrl: config.appIconUrl || '',
			includeMetadata: true,
			imageType: ImageType.Primary,
			...config,
		}
	}

	/**
	 * Converts an array of BaseItemDto items to MediaLibrary format
	 * @param folderName The name of the folder/collection
	 * @param items Array of BaseItemDto items to convert
	 * @param layoutType Optional layout type override
	 * @returns MediaLibrary object compatible with react-native-sportscar
	 */
	convertToMediaLibrary(
		folderName: string,
		items: BaseItemDto[],
		layoutType?: LayoutType,
	): MediaLibrary {
		const rootItems: MediaItem[] = items.map((item) => this.convertBaseItemDtoToMediaItem(item))

		return {
			layoutType: layoutType || this.config.defaultLayoutType,
			rootItems,
			appName: this.config.appName,
			appIconUrl: this.config.appIconUrl,
		}
	}

	/**
	 * Converts a single BaseItemDto to MediaItem format
	 * @param item BaseItemDto to convert
	 * @returns MediaItem object
	 */
	public convertBaseItemDtoToMediaItem(item: BaseItemDto): MediaItem {
		const mediaType = this.determineMediaType(item)
		const isPlayable = this.isItemPlayable(item)

		const mediaItem: MediaItem = {
			id: item.Id || `item_${Date.now()}_${Math.random()}`,
			title: item.Name || 'Unknown Title',
			subtitle: this.generateSubtitle(item),
			iconUrl: this.getItemImageUrl(item),
			isPlayable,
			mediaType,
			layoutType: this.determineLayoutType(item),
		}

		// Add media URL for playable items
		if (isPlayable && this.config.api) {
			mediaItem.mediaUrl = this.generateMediaUrl(item)
		}

		// Add duration for media items
		if (item.RunTimeTicks && isPlayable) {
			mediaItem.durationMs = this.convertTicksToMilliseconds(item.RunTimeTicks)
		}

		// Add children for folder items
		if (item.Type === BaseItemKind.Folder && item.ChildCount && item.ChildCount > 0) {
			// Note: This would require additional API calls to fetch children
			// For now, we'll leave children empty and let the app handle lazy loading
			mediaItem.children = []
		}

		// Add metadata if enabled
		if (this.config.includeMetadata) {
			mediaItem.metadata = this.extractMetadata(item)
		}

		return mediaItem
	}

	/**
	 * Determines the media type based on BaseItemDto properties
	 */
	private determineMediaType(item: BaseItemDto): MediaType {
		if (item.Type === BaseItemKind.Folder || item.IsFolder) {
			return 'folder'
		}

		// Check if it's a video based on media sources or type
		if (
			item.Type === BaseItemKind.Movie ||
			item.Type === BaseItemKind.Episode ||
			item.Type === BaseItemKind.Video ||
			item.MediaType === 'Video'
		) {
			return 'video'
		}

		// Default to audio for music tracks, albums, etc.
		return 'audio'
	}

	/**
	 * Determines if an item is playable
	 */
	private isItemPlayable(item: BaseItemDto): boolean {
		if (item.Type === BaseItemKind.Audio) {
			return true
		}

		if (item.Type === BaseItemKind.Video) {
			return true
		}

		if (item.Type === BaseItemKind.Episode) {
			return true
		}
		if (item.Type === BaseItemKind.Movie) {
			return true
		}
		if (item.Type === BaseItemKind.Season) {
			return true
		}
		if (item.Type === BaseItemKind.Series) {
			return true
		}
		if (item.Type === BaseItemKind.MusicAlbum) {
			return true
		}
		if (item.Type === BaseItemKind.Playlist) {
			return false
		}
		// Folders are not directly playable
		if (item.Type === BaseItemKind.Folder || item.IsFolder) {
			return false
		}

		// Items with media sources are playable
		return !!(item.MediaSources && item.MediaSources.length > 0)
	}

	/**
	 * Generates a subtitle for the media item
	 */
	private generateSubtitle(item: BaseItemDto): string | undefined {
		const parts: string[] = []

		// Add artist information
		if (item.Artists && item.Artists.length > 0) {
			parts.push(item.Artists.join(', '))
		}

		// Add album information
		if (item.Album) {
			parts.push(item.Album)
		}

		// Add year information
		if (item.ProductionYear) {
			parts.push(item.ProductionYear.toString())
		}

		// Add genre information
		if (item.Genres && item.Genres.length > 0) {
			parts.push(item.Genres.join(', '))
		}

		// Add duration for playable items
		if (item.RunTimeTicks && this.isItemPlayable(item)) {
			const duration = this.formatDuration(item.RunTimeTicks)
			parts.push(duration)
		}

		return parts.length > 0 ? parts.join(' • ') : undefined
	}

	/**
	 * Gets the image URL for an item
	 */
	private getItemImageUrl(item: BaseItemDto): string | undefined {
		if (!this.config.api) {
			return undefined
		}

		try {
			// Use the existing utility function from the app
			return getItemImageUrl(this.config.api, item, this.config.imageType)
		} catch (error) {
			console.warn('Failed to generate image URL for item:', item.Id, error)
			return undefined
		}
	}

	/**
	 * Generates media URL for playable items
	 */
	private generateMediaUrl(item: BaseItemDto): string | undefined {
		if (!this.config.api || !item.Id) {
			return undefined
		}

		try {
			// Use the same pattern as the app's buildAudioApiUrl function
			// This generates a streaming URL for the item
			const urlParams = new URLSearchParams({
				playSessionId: this.generatePlaySessionId(),
				startTimeTicks: '0',
				static: 'true',
			})

			return `${this.config.api.basePath}/Audio/${item.Id}/stream?${urlParams}`
		} catch (error) {
			console.warn('Failed to generate media URL for item:', item.Id, error)
			return undefined
		}
	}

	/**
	 * Generates a play session ID
	 */
	private generatePlaySessionId(): string {
		// Simple UUID-like generation for play session ID
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			const r = (Math.random() * 16) | 0
			const v = c === 'x' ? r : (r & 0x3) | 0x8
			return v.toString(16)
		})
	}

	/**
	 * Determines the layout type for an item
	 */
	private determineLayoutType(item: BaseItemDto): LayoutType | undefined {
		// Albums and playlists might look better in grid layout
		if (
			item.Type === BaseItemKind.MusicAlbum ||
			item.Type === BaseItemKind.Playlist ||
			item.Type === BaseItemKind.MusicArtist
		) {
			return 'grid'
		}

		// For other items, use the default layout
		return undefined
	}

	/**
	 * Extracts metadata from BaseItemDto
	 */
	private extractMetadata(item: BaseItemDto): Record<string, unknown> {
		const metadata: Record<string, unknown> = {}

		if (item.Genres && item.Genres.length > 0) {
			metadata.genres = item.Genres
		}

		if (item.ProductionYear) {
			metadata.year = item.ProductionYear
		}

		if (item.CommunityRating) {
			metadata.rating = item.CommunityRating
		}

		if (item.PremiereDate) {
			metadata.premiereDate = item.PremiereDate
		}

		if (item.Artists && item.Artists.length > 0) {
			metadata.artists = item.Artists
		}

		if (item.Album) {
			metadata.album = item.Album
		}

		if (item.AlbumArtist) {
			metadata.albumArtist = item.AlbumArtist
		}

		if (item.RunTimeTicks) {
			metadata.durationTicks = item.RunTimeTicks
			metadata.durationMs = this.convertTicksToMilliseconds(item.RunTimeTicks)
		}

		if (item.MediaType) {
			metadata.mediaType = item.MediaType
		}

		if (item.Type) {
			metadata.itemType = item.Type
		}

		return metadata
	}

	/**
	 * Converts Jellyfin ticks to milliseconds
	 */
	private convertTicksToMilliseconds(ticks: number): number {
		// Jellyfin uses 10,000,000 ticks per second
		return Math.round(ticks / 10000)
	}

	/**
	 * Formats duration from ticks to human readable format
	 */
	private formatDuration(ticks: number): string {
		const milliseconds = this.convertTicksToMilliseconds(ticks)
		const seconds = Math.floor(milliseconds / 1000)
		const minutes = Math.floor(seconds / 60)
		const hours = Math.floor(minutes / 60)

		if (hours > 0) {
			return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
		} else {
			return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
		}
	}
}

/**
 * Convenience function to create a MediaLibrary from BaseItemDto array
 * @param folderName Name of the folder/collection
 * @param items Array of BaseItemDto items
 * @param config Optional configuration
 * @returns MediaLibrary object
 */
export function createMediaLibrary(
	folderName: string,
	items: BaseItemDto[],
	config?: MediaLibraryConverterConfig,
): MediaLibrary {
	const converter = new MediaLibraryConverter(config)
	return converter.convertToMediaLibrary(folderName, items)
}

/**
 * Type guard to check if an item is already a MediaItem
 * @param item Item to check
 * @returns true if item is a MediaItem, false if it's a BaseItemDto
 */
function isMediaItem(item: BaseItemDto | MediaItem): item is MediaItem {
	return 'isPlayable' in item && 'mediaType' in item
}

/**
 * Standalone function to convert a single BaseItemDto to MediaItem
 * @param item BaseItemDto to convert
 * @param config Optional configuration
 * @returns MediaItem object
 */
export function convertBaseItemDtoToMediaItem(
	item: BaseItemDto,
	config?: MediaLibraryConverterConfig,
): MediaItem {
	const converter = new MediaLibraryConverter(config)
	return converter.convertBaseItemDtoToMediaItem(item)
}

/**
 * Creates a Sports Car MediaLibrary with multiple folders
 * @param folders Array of folder configurations or MediaItems
 * @param config Optional configuration
 * @returns MediaLibrary object
 */
export function createSportsCarLibrary(
	folders:
		| Array<{
				name: string
				items: BaseItemDto[] | MediaItem[]
				layoutType?: LayoutType
		  }>
		| MediaItem[],
	config?: MediaLibraryConverterConfig,
): MediaLibrary {
	const converter = new MediaLibraryConverter(config)

	// Check if folders is an array of MediaItems or folder configurations
	const isMediaItemArray = folders.length > 0 && 'isPlayable' in folders[0]

	let rootItems: MediaItem[]

	if (isMediaItemArray) {
		// If folders is an array of MediaItems, use them directly
		rootItems = folders as MediaItem[]
	} else {
		// If folders is an array of folder configurations, process them
		rootItems = (
			folders as Array<{
				name: string
				items: BaseItemDto[] | MediaItem[]
				layoutType?: LayoutType
			}>
		).map((folder) => {
			// Check if items are already MediaItems or need conversion
			const children: MediaItem[] = folder.items.map((item) => {
				if (isMediaItem(item)) {
					// It's already a MediaItem, return as is
					return item
				} else {
					// It's a BaseItemDto, convert it
					return converter.convertBaseItemDtoToMediaItem(item)
				}
			})

			const folderItem: MediaItem = {
				id: `folder_${folder.name.toLowerCase().replace(/\s+/g, '_')}`,
				title: folder.name,
				subtitle: `${folder.items.length} items`,
				isPlayable: false,
				mediaType: 'folder',
				layoutType: folder.layoutType || config?.defaultLayoutType || 'list',
				children,
			}
			return folderItem
		})
	}

	return {
		layoutType: config?.defaultLayoutType || 'list',
		rootItems,
		appName: config?.appName || 'Jellify',
		appIconUrl: config?.appIconUrl,
	}
}

/**
 * Helper function to process a single folder configuration into a MediaItem
 * @param folder Single folder configuration
 * @param converter MediaLibraryConverter instance
 * @returns MediaItem representing the folder
 */
function processFolderToMediaItem(
	folder: {
		name: string
		items: BaseItemDto[] | MediaItem[]
		layoutType?: LayoutType
	},
	converter: MediaLibraryConverter,
): MediaItem {
	// Check if items are already MediaItems or need conversion
	const folderChildren: MediaItem[] = folder.items.map((item) => {
		if (isMediaItem(item)) {
			// It's already a MediaItem, return as is
			return item
		} else {
			// It's a BaseItemDto, convert it
			return converter.convertBaseItemDtoToMediaItem(item)
		}
	})

	return {
		id: `folder_${folder.name.toLowerCase().replace(/\s+/g, '_')}`,
		title: folder.name,
		subtitle: `${folder.items.length} items`,
		isPlayable: false,
		mediaType: 'folder',
		layoutType: folder.layoutType || 'list',
		children: folderChildren,
	}
}

/**
 * Helper function to process multiple folder configurations into MediaItems
 * @param folders Array of folder configurations
 * @param converter MediaLibraryConverter instance
 * @returns Array of MediaItems representing the folders
 */
function processFoldersToMediaItems(
	folders: Array<{
		name: string
		items: BaseItemDto[] | MediaItem[]
		layoutType?: LayoutType
	}>,
	converter: MediaLibraryConverter,
): MediaItem[] {
	return folders.map((folder) => processFolderToMediaItem(folder, converter))
}

/**
 * Creates a Sports Car MediaItem with single or multiple folders as children
 * @param folders Single folder configuration or array of folder configurations
 * @param config Optional configuration
 * @param title Optional title for the root item
 * @param id Optional custom ID for the root item
 * @returns MediaItem object with children
 */
export function createSportsCarItem(
	folders: {
		name: string
		items: BaseItemDto[] | MediaItem[]
		layoutType?: LayoutType
		iconUrl?: string
	},
	config?: MediaLibraryConverterConfig,
	title?: string,
	id?: string,
): MediaItem {
	const converter = new MediaLibraryConverter(config)

	// Single folder - directly process the items without creating an extra folder wrapper
	const folderChildren: MediaItem[] = folders.items.map((item) => {
		if (isMediaItem(item)) {
			// It's already a MediaItem, return as is
			return item
		} else {
			// It's a BaseItemDto, convert it
			return converter.convertBaseItemDtoToMediaItem(item)
		}
	})

	const children = folderChildren
	const defaultTitle = folders.name
	const defaultId = 'single_folder_root'

	return {
		id: id || defaultId,
		title: title || defaultTitle,
		subtitle: `${folders.items.length} items`,
		isPlayable: false,
		mediaType: 'folder',
		layoutType: folders.layoutType || 'list',
		iconUrl: folders.iconUrl,
		children,
		metadata: {
			appName: config?.appName || 'Jellify',
			appIconUrl: config?.appIconUrl,
		},
	}
}
