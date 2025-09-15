import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { isUndefined } from 'lodash'
import { getTokenValue, Token, View } from 'tamagui'
import { useJellifyContext } from '../../../providers'
import { StyleSheet, ViewStyle } from 'react-native'
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { NitroImage, useImage } from 'react-native-nitro-image'
import { Blurhash } from 'react-native-blurhash'
import { getBlurhashFromDto } from '../../../utils/blurhash'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { getItemImageUrl } from '../../../api/queries/image/utils'
import { useMemo } from 'react'

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

const Styles = StyleSheet.create({
	blurhash: {
		width: '100%',
		height: '100%',
	},
})

function ItemBlurhash({ item }: ItemBlurhashProps): React.JSX.Element {
	const blurhash = getBlurhashFromDto(item)

	return (
		<AnimatedBlurhash
			resizeMode={'cover'}
			style={Styles.blurhash}
			blurhash={blurhash}
			entering={FadeIn}
			exiting={FadeOut}
		/>
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
	const { image } = useImage({ url: imageUrl })

	const imageViewStyle = useMemo(
		() =>
			StyleSheet.create({
				view: {
					borderRadius: cornered
						? 0
						: width
							? getBorderRadius(circular, width)
							: circular
								? getTokenValue('$20') * 10
								: getTokenValue('$2'),
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
			}),
		[cornered, circular, width, height],
	)

	return (
		<View style={imageViewStyle.view} justifyContent='center' alignContent='center'>
			{image ? (
				<AnimatedNitroImage
					resizeMode='cover'
					recyclingKey={imageUrl}
					image={image}
					testID={testID}
					entering={FadeIn}
					exiting={FadeOut}
					style={Styles.blurhash}
				/>
			) : (
				<ItemBlurhash item={item} />
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
	} else borderRadius = getTokenValue('$2')

	return borderRadius
}
