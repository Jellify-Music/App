import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { isUndefined } from 'lodash'
import { getTokenValue, Token, useTheme, View } from 'tamagui'
import { useJellifyContext } from '../../../providers'
import { ImageStyle } from 'react-native'
import { NitroImage, useWebImage } from 'react-native-nitro-image'
import { Blurhash } from 'react-native-blurhash'
import { getPrimaryBlurhashFromDto } from '../../../utils/blurhash'

interface ImageProps {
	item: BaseItemDto
	circular?: boolean | undefined
	width?: Token | number | undefined
	height?: Token | number | undefined
	style?: ImageStyle | undefined
	testID?: string | undefined
}

export default function ItemImage({
	item,
	circular,
	width,
	height,
	style,
	testID,
}: ImageProps): React.JSX.Element {
	const { api } = useJellifyContext()
	const theme = useTheme()

	const imageUrl =
		(item.AlbumId && getImageApi(api!).getItemImageUrlById(item.AlbumId)) ||
		(item.Id && getImageApi(api!).getItemImageUrlById(item.Id)) ||
		''

	const image = useWebImage(imageUrl)

	const blurhash = getPrimaryBlurhashFromDto(item)

	return (
		<View
			style={{
				shadowRadius: getTokenValue('$4'),
				shadowOffset: {
					width: 0,
					height: -getTokenValue('$4'),
				},
				shadowColor: theme.borderColor.val,
				borderRadius: getBorderRadius(circular, width),
				width: !isUndefined(width)
					? typeof width === 'number'
						? width
						: getTokenValue(width)
					: getTokenValue('$12') + getTokenValue('$5'),
				height: !isUndefined(height)
					? typeof height === 'number'
						? height
						: getTokenValue(height)
					: getTokenValue('$12') + getTokenValue('$5'),
				alignSelf: 'center',
				backgroundColor: theme.borderColor.val,
				overflow: 'hidden',
			}}
		>
			{image ? (
				<NitroImage
					key={item.Id}
					image={image}
					testID={testID}
					style={{
						height: '100%',
						width: '100%',
					}}
				/>
			) : (
				<Blurhash
					blurhash={blurhash || ''}
					style={{
						width: '100%',
						height: '100%',
					}}
				/>
			)}
		</View>
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
