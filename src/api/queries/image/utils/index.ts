import { Api } from '@jellyfin/sdk'
import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'

export function getItemImageUrl(
	api: Api | undefined,
	item: BaseItemDto,
	type: ImageType,
): string | undefined {
	const { AlbumId, AlbumPrimaryImageTag, ImageTags, Id } = item

	if (!api) return undefined

	return AlbumId
		? getImageApi(api).getItemImageUrlById(AlbumId, type, {
				tag: AlbumPrimaryImageTag ?? undefined,
			})
		: Id
			? getImageApi(api).getItemImageUrlById(Id, type, {
					tag: ImageTags ? ImageTags[type] : undefined,
				})
			: undefined
}
