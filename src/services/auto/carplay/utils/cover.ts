import { getItemImageUrl } from '../../../../api/queries/image/utils'
import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client'

export const cover = (item: BaseItemDto | undefined) =>
	item && getItemImageUrl(item, ImageType.Primary, { maxWidth: 300, maxHeight: 300 })
