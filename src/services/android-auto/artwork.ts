import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import DeviceInfo from 'react-native-device-info'
import { getItemImageUrl } from '../../api/queries/image/utils'

const IMAGE_PATH = /\/Items\/([0-9a-fA-F]{32})\/Images\/(Primary|Backdrop|Thumb)(?:[/?]|$)/
const TAG_PARAM = /[?&]tag=([^&]+)/

/**
 * Converts a Jellyfin image URL into the app's `content://` artwork URI, which is what
 * Android Auto requires for icons (it only loads content:// and android.resource:// URIs;
 * our `https://…` Jellyfin URLs are never shown). Pure — no network, just parses the URL
 * `getItemImageUrl` already builds (keeping its album/parent/artist fallback logic). The
 * Jellyfin `tag` (when present) is carried over so the cache key changes when art changes.
 */
export function artworkUri(
	item: BaseItemDto | undefined,
	type: ImageType = ImageType.Primary,
): string | undefined {
	if (!item) return undefined

	const imageUrl = getItemImageUrl(item, type, { maxWidth: 400, maxHeight: 400 })
	if (!imageUrl) return undefined

	const pathMatch = IMAGE_PATH.exec(imageUrl)
	if (!pathMatch) return undefined
	const [, itemId, imageType] = pathMatch

	const tagMatch = TAG_PARAM.exec(imageUrl)
	const query = tagMatch ? `?tag=${tagMatch[1]}` : ''

	return `content://${DeviceInfo.getBundleId()}.artwork/${itemId}/${imageType}${query}`
}
