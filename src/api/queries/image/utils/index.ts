import { getApi } from '../../../../stores'
import { BaseItemDto, BaseItemKind, ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { ImageUrlsApi } from '@jellyfin/sdk/lib/utils/api/image-urls-api'

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
	const {
		AlbumId,
		AlbumPrimaryImageTag,
		Type,
		BackdropImageTags,
		ParentId,
		ParentPrimaryImageItemId,
		ParentPrimaryImageTag,
		ImageTags,
		Id,
		AlbumArtists,
		ArtistItems,
	} = item

	const api = getApi()

	if (!api) return undefined

	// Use provided dimensions or default thumbnail size for list performance
	const imageParams = {
		tag: undefined as string | undefined,
		maxWidth: options?.maxWidth ?? DEFAULT_THUMBNAIL_SIZE,
		maxHeight: options?.maxHeight ?? DEFAULT_THUMBNAIL_SIZE,
		quality: options?.quality ?? 90,
	}

	const imageApi = getImageApi(api)

	// Backdrop images are stored separately from ImageTags in the Jellyfin data model.
	// BackdropImageTags is an array of cache-buster tags, not a keyed object like ImageTags.
	if (type === ImageType.Backdrop) return getItemBackdropUrl(item, imageApi, imageParams)

	// For all other image types (Primary, Thumb, Logo, etc.)

	// 1. Item has its own tag for the requested type
	if (Id && ImageTags?.[type]) {
		return imageApi.getItemImageUrlById(Id, type, {
			...imageParams,
			tag: ImageTags[type],
		})
	}

	// 1b. Artist cards request Primary by default, but some libraries only expose artist backdrops.
	// Use the first backdrop as a visual fallback to avoid blank artist avatars.
	if (
		type === ImageType.Primary &&
		Type === BaseItemKind.MusicArtist &&
		Id &&
		BackdropImageTags?.length
	) {
		return imageApi.getItemImageUrlById(Id, ImageType.Backdrop, {
			...imageParams,
			tag: BackdropImageTags[0],
		})
	}

	// 2a. Fall back to album primary image (music-specific parent path)
	// Only use this path when the album actually has an image tag,
	// otherwise continue to artist fallback.
	if (AlbumId && AlbumPrimaryImageTag) {
		return imageApi.getItemImageUrlById(AlbumId, ImageType.Primary, {
			...imageParams,
			tag: AlbumPrimaryImageTag,
		})
	}

	// 2b. Fall back via generic parent primary image (used by some Jellyfin servers
	//     instead of AlbumId/AlbumPrimaryImageTag). Some responses only provide ParentId.
	const parentPrimaryId = ParentPrimaryImageItemId ?? ParentId
	if (parentPrimaryId) {
		return imageApi.getItemImageUrlById(parentPrimaryId, ImageType.Primary, {
			...imageParams,
			tag: ParentPrimaryImageTag ?? undefined,
		})
	}

	// 3. Fall back to first artist's primary image
	const artistId = AlbumArtists?.[0]?.Id ?? ArtistItems?.[0]?.Id
	if (artistId) {
		return imageApi.getItemImageUrlById(artistId, ImageType.Primary, {
			...imageParams,
		})
	}

	// 4. Last ditch: item's own ID with requested type (can still resolve inherited image server-side)
	if (Id) {
		return imageApi.getItemImageUrlById(Id, type, {
			...imageParams,
		})
	}

	return undefined
}

function getItemBackdropUrl(
	item: BaseItemDto,
	imageApi: ImageUrlsApi,
	imageParams: ImageUrlOptions,
): string | undefined {
	const {
		Id,
		BackdropImageTags,
		ParentBackdropItemId,
		ParentBackdropImageTags,
		AlbumId,
		AlbumPrimaryImageTag,
		ImageTags,
	} = item

	// 1. Item's own backdrop
	if (Id && BackdropImageTags && BackdropImageTags.length > 0) {
		return imageApi.getItemImageUrlById(Id, ImageType.Backdrop, {
			...imageParams,
			tag: BackdropImageTags[0],
		})
	}
	// 2. Parent backdrop (e.g. artist backdrop surfaced on a track/album)
	if (ParentBackdropItemId && ParentBackdropImageTags && ParentBackdropImageTags.length > 0) {
		return imageApi.getItemImageUrlById(ParentBackdropItemId, ImageType.Backdrop, {
			...imageParams,
			tag: ParentBackdropImageTags[0],
		})
	}
	// 3. Fall back to album primary image
	if (AlbumId) {
		return imageApi.getItemImageUrlById(AlbumId, ImageType.Primary, {
			...imageParams,
			tag: AlbumPrimaryImageTag ?? undefined,
		})
	}
	// 4. Fall back to item's own primary image
	if (Id && ImageTags?.[ImageType.Primary]) {
		return imageApi.getItemImageUrlById(Id, ImageType.Primary, {
			...imageParams,
			tag: ImageTags[ImageType.Primary],
		})
	}
	return undefined
}
