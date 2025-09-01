import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { isUndefined } from 'lodash'
import { getTokenValue, Token } from 'tamagui'
import { useJellifyContext } from '../../../providers'
import { StyleSheet } from 'react-native'
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { NitroImage, useImage } from 'react-native-nitro-image'
import { Blurhash } from 'react-native-blurhash'
import { getBlurhashFromDto } from '../../../utils/blurhash'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { getItemImageUrl } from '../../../api/queries/image/utils'

interface ItemImageProps {
	item: BaseItemDto
	type?: ImageType
	circular?: boolean | undefined
	width?: Token | number | undefined
	height?: Token | number | undefined
	testID?: string | undefined
}

export default function ItemImage({
	item,
	type = ImageType.Primary,
	circular,
	width,
	height,
	testID,
}: ItemImageProps): React.JSX.Element {
	const { api } = useJellifyContext()

	const imageUrl = getItemImageUrl(api, item, type)

	return api && imageUrl?.includes(api.basePath) ? (
		<Image
			item={item}
			imageUrl={imageUrl}
			testID={testID}
			height={height}
			width={width}
			circular={circular}
		/>
	) : (
		<></>
	)
}

interface ItemBlurhashProps {
	item: BaseItemDto
	circular?: boolean | undefined
	width?: Token | number | undefined
	height?: Token | number | undefined
	testID?: string | undefined
}

function ItemBlurhash({
	item,
	circular,
	width,
	height,
	testID,
}: ItemBlurhashProps): React.JSX.Element {
	const blurhash = getBlurhashFromDto(item)

	const blurhashStyle = StyleSheet.create({
		blurhash: {
			borderRadius: width ? getBorderRadius(circular, width) : circular ? '100%' : '5%',
			width: !isUndefined(width)
				? typeof width === 'number'
					? width
					: getTokenValue(width)
				: '100%',
			height: !isUndefined(height)
				? typeof height === 'number'
					? height
					: getTokenValue(height)
				: '100%',
			alignSelf: 'center',
			overflow: 'hidden',
		},
	})

	return blurhash ? (
		<Animated.View entering={FadeIn} exiting={FadeOut}>
			<Blurhash blurhash={blurhash} style={blurhashStyle.blurhash} />
		</Animated.View>
	) : (
		<></>
	)
}

interface ImageProps {
	imageUrl: string
	item: BaseItemDto
	circular?: boolean | undefined
	width?: Token | number | undefined
	height?: Token | number | undefined
	testID?: string | undefined
}

function Image({ item, imageUrl, width, height, circular, testID }: ImageProps): React.JSX.Element {
	const { image, error } = useImage({ url: imageUrl })

	const imageStyle = StyleSheet.create({
		image: {
			borderRadius: width ? getBorderRadius(circular, width) : circular ? '100%' : '5%',
			width: !isUndefined(width)
				? typeof width === 'number'
					? width
					: getTokenValue(width)
				: '100%',
			height: !isUndefined(height)
				? typeof height === 'number'
					? height
					: getTokenValue(height)
				: '100%',
			alignSelf: 'center',
			overflow: 'hidden',
		},
	})

	return image ? (
		<Animated.View entering={FadeIn} exiting={FadeOut}>
			<NitroImage
				resizeMode='cover'
				recyclingKey={imageUrl}
				image={image}
				testID={testID}
				style={imageStyle.image}
			/>
		</Animated.View>
	) : (
		<ItemBlurhash item={item} circular={circular} width={width} height={height} />
	)
}

/**
 * Get the border radius for the image
 * @param circular - Whether the image is circular
 * @param width - The width of the image
 * @returns The border radius of the image
 */
function getBorderRadius(circular: boolean | undefined, width: Token | number): number {
	let borderRadius

	if (circular) {
		borderRadius = typeof width === 'number' ? width : getTokenValue(width)
	} else if (!isUndefined(width)) {
		borderRadius = typeof width === 'number' ? width / 25 : getTokenValue(width) / 15
	} else borderRadius = '5%'

	return borderRadius
}
