import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { BaseItemDtoSlimified } from '../../types/JellifyTrack'

/**
 *
 * @param param0 The {@link BaseItemDto} to extract the blurhash from
 * @param type The {@link ImageType} who's blurhash should be extracted
 * @returns A string representation of the encoded blurhash. Falls back to an empty string if the blurhash doesn't exist
 */
export function getBlurhashFromDto(
	{ ImageBlurHashes }: BaseItemDto | BaseItemDtoSlimified,
	type: ImageType = ImageType.Primary,
) {
	if (!ImageBlurHashes || !ImageBlurHashes[type]) return ''

	const blurhashKey: string = Object.keys(ImageBlurHashes[type])[0]

	if (!blurhashKey) return ''

	const blurhashValue: string = ImageBlurHashes[type][blurhashKey] ?? ''

	return blurhashValue
}
