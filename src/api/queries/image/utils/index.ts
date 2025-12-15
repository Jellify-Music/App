import { Api } from '@jellyfin/sdk'
import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { MusicServerAdapter } from '../../../core/adapter'

// Default image size for list thumbnails (optimized for common row heights)
const DEFAULT_THUMBNAIL_SIZE = 200

export interface ImageUrlOptions {
	/** Maximum width of the requested image */
	maxWidth?: number
	/** Maximum height of the requested image */
	maxHeight?: number
	/** Image quality (0-100) */
	quality?: number
}

/**
 * Get the image URL for an item (Jellyfin SDK version).
 * For Navidrome, use getUnifiedItemImageUrl instead.
 */
export function getItemImageUrl(
	api: Api | undefined,
	item: BaseItemDto,
	type: ImageType,
	options?: ImageUrlOptions,
): string | undefined {
	const { AlbumId, AlbumPrimaryImageTag, ImageTags, Id, AlbumArtists } = item

	if (!api) return undefined

	// Use provided dimensions or default thumbnail size for list performance
	const imageParams = {
		tag: undefined as string | undefined,
		maxWidth: options?.maxWidth ?? DEFAULT_THUMBNAIL_SIZE,
		maxHeight: options?.maxHeight ?? DEFAULT_THUMBNAIL_SIZE,
		quality: options?.quality ?? 90,
	}

	// Check if the item has its own image for the requested type first
	const hasOwnImage = ImageTags && ImageTags[type]

	if (hasOwnImage && Id) {
		// Use the item's own image (e.g., track-specific artwork)
		return getImageApi(api).getItemImageUrlById(Id, type, {
			...imageParams,
			tag: ImageTags[type],
		})
	} else if (AlbumId && AlbumPrimaryImageTag) {
		// Fall back to album image (only if the album has an image)
		return getImageApi(api).getItemImageUrlById(AlbumId, type, {
			...imageParams,
			tag: AlbumPrimaryImageTag,
		})
	} else if (AlbumArtists && AlbumArtists.length > 0 && AlbumArtists[0].Id) {
		// Fall back to first album artist's image
		return getImageApi(api).getItemImageUrlById(AlbumArtists[0].Id, type, {
			...imageParams,
		})
	} else if (Id) {
		// Last resort: use item's own ID
		return getImageApi(api).getItemImageUrlById(Id, type, {
			...imageParams,
			tag: ImageTags ? ImageTags[type] : undefined,
		})
	}

	return undefined
}

/**
 * Get the image URL for an item using the unified adapter.
 * Works with both Jellyfin and Navidrome.
 */
export function getUnifiedItemImageUrl(
	adapter: MusicServerAdapter | undefined,
	item: BaseItemDto,
	options?: ImageUrlOptions,
): string | undefined {
	if (!adapter) return undefined

	const { AlbumId, Id, AlbumArtists } = item
	const size = options?.maxWidth ?? options?.maxHeight ?? DEFAULT_THUMBNAIL_SIZE

	// Priority: AlbumId > Item's own Id > First artist Id
	if (AlbumId) {
		return adapter.getCoverArtUrl(AlbumId, size)
	} else if (Id) {
		return adapter.getCoverArtUrl(Id, size)
	} else if (AlbumArtists && AlbumArtists.length > 0 && AlbumArtists[0].Id) {
		return adapter.getCoverArtUrl(AlbumArtists[0].Id, size)
	}

	return undefined
}
