import { Api } from '@jellyfin/sdk'
import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'

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

export function getItemImageUrl(
	api: Api | undefined,
	item: BaseItemDto,
	type: ImageType,
	options?: ImageUrlOptions,
): string | undefined {
	const { AlbumId, AlbumPrimaryImageTag, ImageTags, Id } = item

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
	} else if (AlbumId) {
		// Fall back to album image
		return getImageApi(api).getItemImageUrlById(AlbumId, type, {
			...imageParams,
			tag: AlbumPrimaryImageTag ?? undefined,
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
