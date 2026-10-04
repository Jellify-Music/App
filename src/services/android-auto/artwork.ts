import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import DeviceInfo from 'react-native-device-info'
import { getItemImageUrl } from '../../api/queries/image/utils'
import { firstLetterBucket } from '../../utils/grouping/alphabetical'

const IMAGE_PATH = /\/Items\/([0-9a-fA-F]{32})\/Images\/(Primary|Backdrop|Thumb)(?:[/?]|$)/
const TAG_PARAM = /[?&]tag=([^&]+)/

/** Most covers in one collage tile (a 3×3 grid). */
const MAX_COLLAGE_ITEMS = 9

const base = () => `content://${DeviceInfo.getBundleId()}.artwork`

type ImageRef = { itemId: string; imageType: string; tag?: string }

/** The Jellyfin image `getItemImageUrl` picks for `item` (keeping its album/parent/artist fallbacks). */
function imageRef(item: BaseItemDto, type: ImageType): ImageRef | undefined {
	const imageUrl = getItemImageUrl(item, type, { maxWidth: 400, maxHeight: 400 })
	const pathMatch = imageUrl ? IMAGE_PATH.exec(imageUrl) : null
	if (!imageUrl || !pathMatch) return undefined
	return { itemId: pathMatch[1], imageType: pathMatch[2], tag: TAG_PARAM.exec(imageUrl)?.[1] }
}

/** The letter tile the artwork provider draws for `letter` (A–Z or `#`). */
export const letterArtworkUri = (letter: string): string =>
	`${base()}/placeholder?letter=${encodeURIComponent(letter)}`

/**
 * Converts a Jellyfin image into the app's `content://` artwork URI, which is what Android
 * Auto requires for icons (it only loads content:// and android.resource:// URIs; our
 * `https://…` Jellyfin URLs are never shown). Pure — no network. The Jellyfin `tag` (when
 * present) is carried over so the cache key changes when art changes.
 *
 * Every URI carries the item's first letter: the provider draws a letter tile when Jellyfin
 * has no image, so a card is never blank.
 */
export function artworkUri(
	item: BaseItemDto | undefined,
	type: ImageType = ImageType.Primary,
): string | undefined {
	if (!item) return undefined

	const initial = firstLetterBucket(item.SortName ?? item.Name)
	const ref = imageRef(item, type)
	if (!ref) return letterArtworkUri(initial)

	const tag = ref.tag ? `tag=${ref.tag}&` : ''
	return `${base()}/${ref.itemId}/${ref.imageType}?${tag}letter=${encodeURIComponent(initial)}`
}

/**
 * One tile showing up to {@link MAX_COLLAGE_ITEMS} of `items`' covers (a single cover when
 * only one has artwork), or the `letter` tile when none has. Only tagged images count:
 * an untagged one is usually a missing image.
 */
export function collageArtworkUri(letter: string, items: BaseItemDto[]): string {
	const refs = items
		.map((item) => imageRef(item, ImageType.Primary))
		.filter((ref): ref is Required<ImageRef> => !!ref?.tag)
		.slice(0, MAX_COLLAGE_ITEMS)
	if (refs.length === 0) return letterArtworkUri(letter)

	const list = refs.map(({ itemId, imageType, tag }) => `${itemId}.${imageType}.${tag}`).join(',')
	return `${base()}/collage?letter=${encodeURIComponent(letter)}&items=${list}`
}
