import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'

export function getPrimaryBlurhashFromDto(item: BaseItemDto) {
	const blurhashKey: string | undefined = item.ImageBlurHashes!.Primary
		? Object.keys(item.ImageBlurHashes!.Primary)[0]
		: undefined

	const blurhashValue: string | undefined = blurhashKey
		? item.ImageBlurHashes!.Primary![blurhashKey!]
		: undefined

	return blurhashValue
}
