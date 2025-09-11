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
	cornered?: boolean | undefined
	circular?: boolean | undefined
	width?: Token | number | string | undefined
	height?: Token | number | string | undefined
	testID?: string | undefined
}

export default function ItemImage({
	item,
	type = ImageType.Primary,
	cornered,
	circular,
	width,
	height,
	testID,
}: ItemImageProps): React.JSX.Element {
	const { api } = useJellifyContext()

	const imageUrl = getItemImageUrl(api, item, type)

	return api ? (
		<Image
			item={item}
			imageUrl={imageUrl!}
			testID={testID}
			height={height}
			width={width}
			circular={circular}
			cornered={cornered}
		/>
	) : (
		<></>
	)
}

interface ItemBlurhashProps {
	item: BaseItemDto
	cornered?: boolean | undefined
	circular?: boolean | undefined
	width?: Token | string | number | string | undefined
	height?: Token | string | number | string | undefined
	testID?: string | undefined
}

const AnimatedBlurhash = Animated.createAnimatedComponent(Blurhash)

function ItemBlurhash({
	item,
	cornered,
	circular,
	width,
	height,
	testID,
}: ItemBlurhashProps): React.JSX.Element {
	const blurhash = getBlurhashFromDto(item)

	const blurhashStyle = StyleSheet.create({
		blurhash: {
			borderRadius: cornered
				? 0
				: width
					? getBorderRadius(circular, width)
					: circular
						? '100%'
						: '5%',
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

	return blurhash ? (
		<AnimatedBlurhash
			blurhash={blurhash}
			style={blurhashStyle.blurhash}
			entering={FadeIn}
			exiting={FadeOut}
		/>
	) : (
		<></>
	)
}

interface ImageProps {
	imageUrl: string
	item: BaseItemDto
	cornered?: boolean | undefined
	circular?: boolean | undefined
	width?: Token | string | number | string | undefined
	height?: Token | string | number | string | undefined
	testID?: string | undefined
}

const AnimatedNitroImage = Animated.createAnimatedComponent(NitroImage)

function Image({
	item,
	imageUrl,
	width,
	height,
	circular,
	cornered,
	testID,
}: ImageProps): React.JSX.Element {
	const { image, error } = useImage({ url: imageUrl })

	const imageStyle = StyleSheet.create({
		image: {
			borderRadius: cornered
				? 0
				: width
					? getBorderRadius(circular, width)
					: circular
						? '100%'
						: '5%',
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

	return image ? (
		<AnimatedNitroImage
			resizeMode='cover'
			recyclingKey={imageUrl}
			image={image}
			testID={testID}
			style={imageStyle.image}
			entering={FadeIn}
			exiting={FadeOut}
		/>
	) : (
		<ItemBlurhash
			item={item}
			circular={circular}
			width={width}
			height={height}
			cornered={cornered}
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
					: getTokenValue(width as Token)
	} else if (!isUndefined(width)) {
		borderRadius =
			typeof width === 'number'
				? width / 25
				: typeof width === 'string' && width.includes('%')
					? 0
					: getTokenValue(width as Token) / 15
	} else borderRadius = '5%'

	return borderRadius
}
