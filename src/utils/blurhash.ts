import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client/models'

export function extractBlurhashFromDto(item: BaseItemDto, imageType: ImageType) {
	const blurhashKey: string | undefined = item.ImageBlurHashes![imageType]
		? Object.keys(item.ImageBlurHashes![imageType])[0]
		: undefined

	const blurhashValue: string | undefined = blurhashKey
		? item.ImageBlurHashes![imageType]![blurhashKey!]
		: undefined

	return blurhashValue
}
