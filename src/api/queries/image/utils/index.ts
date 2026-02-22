import { getApi } from '../../../../stores'
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
	item: BaseItemDto,
	type: ImageType,
	options?: ImageUrlOptions,
): string | undefined {
	const { AlbumId, AlbumPrimaryImageTag, ImageTags, Id, AlbumArtists, ArtistItems } = item

	const api = getApi()

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

	let imageUrl: string | undefined = undefined

	if (hasOwnImage && Id) {
		// Use the item's own image (e.g., track-specific artwork)
		imageUrl = getImageApi(api).getItemImageUrlById(Id, type, {
			...imageParams,
			tag: ImageTags ? ImageTags[type] : undefined,
		})
	} else if (AlbumId && AlbumPrimaryImageTag) {
		// Fall back to album primary image
		imageUrl = getImageApi(api).getItemImageUrlById(AlbumId, type, {
			...imageParams,
			tag: AlbumPrimaryImageTag ?? undefined,
		})
	} else if (AlbumArtists?.[0]?.Id || ArtistItems?.[0]?.Id) {
		// Fall back to first artist's image (AlbumArtists or ArtistItems for slimified tracks)
		const artistId = AlbumArtists?.[0]?.Id ?? ArtistItems?.[0]?.Id
		if (artistId) {
			imageUrl = getImageApi(api).getItemImageUrlById(artistId, type, {
				...imageParams,
			})
		}
	} else if (Id) {
		// Last ditch effort: use the item's own ID without a specific type tag
		imageUrl = getImageApi(api).getItemImageUrlById(Id, type, {
			...imageParams,
		})
	}

	return imageUrl
}
