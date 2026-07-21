import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { getTokenValue, SizeTokens, Square, Token, useTheme } from 'tamagui'
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { getBlurhashFromDto } from '../../../utils/parsing/blurhash'
import { getItemImageUrl, ImageUrlOptions } from '../../../api/queries/image/utils'
import Image from '../utils/image'
import JellifyLogo from '../../Branding/logo'
import { useState, useEffect } from 'react'
import { isEmpty } from 'lodash'

interface ItemImageProps {
	item: BaseItemDto
	customBlurhash?: string
	type?: ImageType
	cornered?: boolean | undefined
	circular?: boolean | undefined
	width?: SizeTokens | number | `${number}%` | undefined
	height?: SizeTokens | number | string | undefined
	testID?: string | undefined
	/** Image resolution options for requesting higher quality images */
	imageOptions?: ImageUrlOptions
	elevate?: boolean
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
	elevate,
}: ItemImageProps): React.JSX.Element {
	const { color, darkBackground75 } = useTheme()

	const [failedToLoad, setFailedToLoad] = useState(false)

	const onError = () => {
		console.debug('Image failed to load')
		setFailedToLoad(true)
	}

	const imageUrl = getItemImageUrl(item, type, imageOptions)

	const blurhash = customBlurhash ?? getBlurhashFromDto(item, type)

	const borderRadius: number = cornered ? 0 : getBorderRadius(circular, width)

	const displayImage = !isEmpty(imageUrl) && !failedToLoad

	const shadowStyle = elevate
		? {
				boxShadow: [
					{
						offsetY: 2,
						offsetX: 0,
						blurRadius: 4,
						spreadDistance: 1,
						color: darkBackground75.val,
					},
				],
			}
		: undefined

	useEffect(() => {
		setFailedToLoad(false)
	}, [item.Id])

	return displayImage ? (
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
			onFailure={onError}
			style={shadowStyle}
		/>
	) : (
		<Square
			backgroundColor={'$neutral'}
			width={width}
			height={height}
			borderRadius={borderRadius}
			alignSelf='center'
		>
			<JellifyLogo size={'67%'} color={color.val} />
		</Square>
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
