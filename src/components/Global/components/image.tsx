import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { isUndefined } from 'lodash'
import { FontSizeTokens, getToken, getTokenValue, Token, useTheme } from 'tamagui'
import { useJellifyContext } from '../../../providers'
import { useWebImage, NitroImage } from 'react-native-nitro-image'
import { StyleProp, ViewStyle } from 'react-native'

interface ImageProps {
	item: BaseItemDto
	circular?: boolean | undefined
	width?: Token | number | undefined
	height?: Token | number | undefined
	style?: ViewStyle | undefined
}

export default function ItemImage({
	item,
	circular,
	width,
	height,
	style,
}: ImageProps): React.JSX.Element {
	const { api } = useJellifyContext()
	const theme = useTheme()

	const image = useWebImage(
		getImageApi(api!).getItemImageUrlById(item.AlbumId!) ||
			getImageApi(api!).getItemImageUrlById(item.Id!),
	)

	return (
		<NitroImage
			image={image}
			style={{
				shadowRadius: getToken('$4'),
				shadowOffset: {
					width: 0,
					height: -getToken('$4'),
				},
				shadowColor: theme.borderColor.val,
				borderRadius: getBorderRadius(circular, width),
				width: !isUndefined(width)
					? typeof width === 'number'
						? width
						: getTokenValue(width)
					: getToken('$12') + getToken('$5'),
				height: !isUndefined(height)
					? typeof height === 'number'
						? height
						: getTokenValue(height)
					: getToken('$12') + getToken('$5'),
				alignSelf: 'center',
				backgroundColor: theme.borderColor.val,
				overflow: 'hidden',
				...style,
			}}
		/>
	)
}

/**
 * Get the border radius for the image
 * @param circular - Whether the image is circular
 * @param width - The width of the image
 * @returns The border radius of the image
 */
function getBorderRadius(circular: boolean | undefined, width: Token | number | undefined): number {
	let borderRadius

	if (circular) {
		borderRadius = width
			? typeof width === 'number'
				? width
				: getTokenValue(width)
			: getTokenValue('$12') + getTokenValue('$5')
	} else if (!isUndefined(width)) {
		borderRadius = typeof width === 'number' ? width / 16 : getTokenValue(width) / 16
	}

	return borderRadius
}
