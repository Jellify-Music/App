import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { isUndefined } from 'lodash'
import { StyleProp } from 'react-native'
import FastImage, { ImageStyle } from 'react-native-fast-image'
import { FontSizeTokens, getFontSizeToken, getToken, getTokenValue, Token, useTheme } from 'tamagui'
import { useJellifyContext } from '../../../providers'
interface ImageProps {
	item: BaseItemDto
	circular?: boolean | undefined
	width?: Token | undefined
	height?: Token | undefined
	style?: ImageStyle | undefined
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
	return (
		<FastImage
			source={{ uri: getImageApi(api!).getItemImageUrlById(item.Id!) }}
			style={{
				borderRadius: getBorderRadius(circular, width),
				width: !isUndefined(width)
					? getTokenValue(width)
					: getToken('$12') + getToken('$5'),
				height: !isUndefined(height)
					? getTokenValue(height)
					: getToken('$12') + getToken('$5'),
				alignSelf: 'center',
				backgroundColor: theme.borderColor.val,
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
function getBorderRadius(circular: boolean | undefined, width: Token | undefined): number {
	let borderRadius

	if (circular) {
		borderRadius = width ? getTokenValue(width) : getTokenValue('$12') + getToken('$5')
	} else if (!isUndefined(width)) {
		borderRadius = getTokenValue(width) / 10
	}

	return borderRadius
}
