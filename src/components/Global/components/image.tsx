import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { isUndefined } from 'lodash'
import { getTokenValue, Square, Token } from 'tamagui'
import { StyleSheet } from 'react-native'
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { getBlurhashFromDto } from '../../../utils/blurhash'
import { getItemImageUrl, ImageUrlOptions } from '../../../api/queries/image/utils'
import { useApi } from '../../../stores'
import TurboImage from 'react-native-turbo-image'

interface ItemImageProps {
	item: BaseItemDto
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
	type = ImageType.Primary,
	cornered,
	circular,
	width,
	height,
	testID,
	imageOptions,
}: ItemImageProps): React.JSX.Element {
	const api = useApi()

	const imageUrl = getItemImageUrl(api, item, type, imageOptions)

	const blurhash = getBlurhashFromDto(item, type)

	const style = getImageStyleSheet(width, height, cornered, circular)

	return imageUrl ? (
		<TurboImage
			cachePolicy='dataCache'
			resizeMode='cover'
			source={{ uri: imageUrl }}
			testID={testID}
			style={style.view}
			placeholder={{
				blurhash,
			}}
		/>
	) : (
		<Square backgroundColor={'$neutral'} style={style.view} />
	)
}

function getImageStyleSheet(
	width: Token | string | number | string | undefined,
	height: Token | string | number | string | undefined,
	cornered: boolean | undefined,
	circular: boolean | undefined,
) {
	return StyleSheet.create({
		view: {
			borderRadius: cornered
				? 0
				: width
					? getBorderRadius(circular, width)
					: circular
						? getTokenValue('$20') * 10
						: getTokenValue('$5'),
			width: !isUndefined(width)
				? typeof width === 'number'
					? width
					: typeof width === 'string' && width.includes('%')
						? width
						: getTokenValue(width as Token)
				: '100%',
			height: !isUndefined(height)
				? typeof height === 'number'
					? height
					: typeof height === 'string' && height.includes('%')
						? height
						: getTokenValue(height as Token)
				: '100%',
			alignSelf: 'center',
			overflow: 'hidden',
		},
	})
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
					: getTokenValue(width as Token)
	} else if (!isUndefined(width)) {
		borderRadius =
			typeof width === 'number'
				? width / 25
				: typeof width === 'string' && width.includes('%')
					? 0
					: getTokenValue(width as Token) / 10
	} else borderRadius = getTokenValue('$10')

	return borderRadius
}

export default ItemImage
