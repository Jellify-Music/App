import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { isUndefined } from 'lodash'
import { getTokenValue, Token, View, Image as TamaguiImage, ZStack } from 'tamagui'
import { StyleSheet } from 'react-native'
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { Blurhash } from 'react-native-blurhash'
import { getBlurhashFromDto } from '../../../utils/blurhash'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { getItemImageUrl } from '../../../api/queries/image/utils'
import { useMemo, useState } from 'react'
import { useApi } from '../../../stores'

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
	const api = useApi()

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

const AnimatedTamaguiImage = Animated.createAnimatedComponent(TamaguiImage)

function Image({
	item,
	imageUrl,
	width,
	height,
	circular,
	cornered,
	testID,
}: ImageProps): React.JSX.Element {
	const [isLoaded, setIsLoaded] = useState<boolean>(false)

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
			}),
		[cornered, circular, width, height],
	)

	return (
		<ZStack style={imageViewStyle.view} justifyContent='center' alignContent='center'>
			<AnimatedTamaguiImage
				objectFit='cover'
				// recyclingKey={imageUrl}
				source={{
					uri: imageUrl,
					cache: 'default',
				}}
				onLoad={() => setIsLoaded(true)}
				testID={testID}
				entering={FadeIn}
				exiting={FadeOut}
				style={Styles.blurhash}
			/>
			{!isLoaded && <ItemBlurhash item={item} />}
		</ZStack>
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
					: getTokenValue(width as Token) / 10
	} else borderRadius = getTokenValue('$10')

	return borderRadius
}
