import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
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

	const borderRadius: number = cornered ? 0 : getBorderRadius(circular, width)

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
				: typeof width === 'string' && width.endsWith('%')
					? getTokenValue('$20') * 25
					: getTokenValue(width as Token) * 25
	} else {
		borderRadius =
			typeof width === 'number'
				? width / 25
				: typeof width === 'string' && width.endsWith('%')
					? getTokenValue('$4')
					: Math.log(getTokenValue(width as Token))
	}

	return borderRadius
}

export default ItemImage
