import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client/models'

export function getBlurhashFromDto(
	{ ImageBlurHashes }: BaseItemDto,
	type: ImageType = ImageType.Primary,
) {
	if (!ImageBlurHashes || !ImageBlurHashes[type]) return ''

	const blurhashKey: string = Object.keys(ImageBlurHashes[type])[0]

	const blurhashValue: string = ImageBlurHashes[type][blurhashKey]

	return blurhashValue
}
