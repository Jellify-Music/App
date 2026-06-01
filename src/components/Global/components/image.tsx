import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { isUndefined } from 'lodash'
import { getTokenValue, Square, Token } from 'tamagui'
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { getBlurhashFromDto } from '../../../utils/parsing/blurhash'
import { getItemImageUrl, ImageUrlOptions } from '../../../api/queries/image/utils'
import Image from '../utils/image'

interface ItemImageProps {
	item: BaseItemDto
	customBlurhash?: string
	type?: ImageType
	cornered?: boolean | undefined
	circular?: boolean | undefined
	width?: Token | number | string | undefined
	height?: Token | number | string | undefined
	testID?: string | undefined
	/** Image resolution options for requesting higher quality images */
	imageOptions?: ImageUrlOptions
}

function ItemImage({
	item,
	customBlurhash,
	type = ImageType.Primary,
	cornered,
	circular,
	width = '100%',
	height = '100%',
	testID,
	imageOptions,
}: ItemImageProps): React.JSX.Element {
	const imageUrl = getItemImageUrl(item, type, imageOptions)

	const blurhash = customBlurhash ?? getBlurhashFromDto(item, type)

	const borderRadius = cornered
		? 0
		: width
			? getBorderRadius(circular, width)
			: circular
				? getTokenValue('$20') * 10
				: getTokenValue('$5')

	return imageUrl ? (
		<Image
			cachePolicy='dataCache'
			objectFit='cover'
			src={imageUrl}
			testID={testID}
			width={width}
			height={height}
			borderRadius={borderRadius}
			placeholder={{
				blurhash,
			}}
			alignSelf='center'
		/>
	) : (
		<Square
			backgroundColor={'$neutral'}
			width={width}
			height={height}
			borderRadius={borderRadius}
			alignSelf='center'
		/>
	)
}

/**
 * Get the border radius for the image
 * @param circular - Whether the image is circular
 * @param width - The width of the image
 * @returns The border radius of the image
 */
function getBorderRadius(
	circular: boolean | undefined,
	width: Token | string | number | string,
): number {
	let borderRadius

	if (circular) {
		borderRadius =
			typeof width === 'number'
				? width
				: typeof width === 'string' && width.includes('%')
					? width
					: getTokenValue(width as Token) * 10
	} else if (!isUndefined(width)) {
		borderRadius =
			typeof width === 'number'
				? width / 10
				: typeof width === 'string' && width.includes('%')
					? '2.5%'
					: getTokenValue(width as Token) / 4
	} else borderRadius = getTokenValue('$10')

	return borderRadius
}

export default ItemImage
