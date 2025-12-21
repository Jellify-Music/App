import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { isUndefined } from 'lodash'
import { getTokenValue, Token, Image as TamaguiImage, ZStack } from 'tamagui'
import { StyleSheet } from 'react-native'
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { Blurhash } from 'react-native-blurhash'
import { getBlurhashFromDto } from '../../../utils/blurhash'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { getItemImageUrl, ImageUrlOptions } from '../../../api/queries/image/utils'
import { useCallback, useState } from 'react'
import { useApi } from '../../../stores'

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

	return imageUrl ? (
		<Image
			item={item}
			type={type}
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
	type: ImageType
	cornered?: boolean | undefined
	circular?: boolean | undefined
	width?: Token | string | number | string | undefined
	height?: Token | string | number | string | undefined
	testID?: string | undefined
}

const Styles = StyleSheet.create({
	blurhash: {
		width: '100%',
		height: '100%',
	},
	blurhashInner: {
		...StyleSheet.absoluteFillObject,
	},
})

function ItemBlurhash({ item, type, testID }: ItemBlurhashProps): React.JSX.Element {
	const blurhash = getBlurhashFromDto(item, type)

	return (
		<Animated.View style={Styles.blurhash} entering={FadeIn} exiting={FadeOut}>
			<Blurhash
				resizeMode={'cover'}
				style={Styles.blurhashInner}
				blurhash={blurhash}
				testID={testID}
			/>
		</Animated.View>
	)
}

interface ImageProps {
	imageUrl: string
	type: ImageType
	item: BaseItemDto
	cornered?: boolean | undefined
	circular?: boolean | undefined
	width?: Token | string | number | string | undefined
	height?: Token | string | number | string | undefined
	testID?: string | undefined
}

function Image({
	item,
	type = ImageType.Primary,
	imageUrl,
	width,
	height,
	circular,
	cornered,
	testID,
}: ImageProps): React.JSX.Element {
	const [isLoaded, setIsLoaded] = useState<boolean>(false)

	const handleImageLoad = useCallback(() => setIsLoaded(true), [setIsLoaded])

	const imageViewStyle = getImageStyleSheet(width, height, cornered, circular)

	const imageSource = { uri: imageUrl }

	const blurhash = !isLoaded ? <ItemBlurhash item={item} type={type} testID={testID} /> : null

	return (
		<ZStack style={imageViewStyle.view} justifyContent='center' alignContent='center'>
			<TamaguiImage
				objectFit='cover'
				source={imageSource}
				testID={testID}
				onLoad={handleImageLoad}
				style={Styles.blurhash}
				animation={'quick'}
			/>
			{blurhash}
		</ZStack>
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
