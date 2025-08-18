import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { isUndefined } from 'lodash'
import { getToken, getTokenValue, Token, useTheme } from 'tamagui'
import { useJellifyContext } from '../../../providers'
import { ImageStyle, StyleSheet } from 'react-native'
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { useMemo } from 'react'
import { Image as NitroImageType, NitroImage, useImage } from 'react-native-nitro-image'
import { Blurhash } from 'react-native-blurhash'
import { getBlurhashFromDto } from '../../../utils/blurhash'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

interface ItemImageProps {
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
}: ItemImageProps): React.JSX.Element {
	const { api } = useJellifyContext()
	const theme = useTheme()

	const imageUrl = useMemo(
		() =>
			api
				? (item.AlbumId &&
						getImageApi(api).getItemImageUrlById(item.AlbumId, ImageType.Primary, {
							tag: item.ImageTags?.Primary,
						})) ||
					(item.Id &&
						getImageApi(api).getItemImageUrlById(item.Id, ImageType.Primary, {
							tag: item.ImageTags?.Primary,
						})) ||
					''
				: '',
		[api, item],
	)

	const image = useImage({ url: imageUrl })

	return image.image ? (
		<Image
			recyclingKey={imageUrl}
			itemId={item.Id}
			image={image.image}
			testID={testID}
			height={height}
			width={width}
			circular={circular}
		/>
	) : (
		<ItemBlurhash
			item={item}
			circular={circular}
			width={width}
			height={height}
			testID={testID}
		/>
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
			borderRadius: width
				? getBorderRadius(circular, width)
				: circular
					? '100%'
					: getToken('$8'),
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
	itemId: string | undefined | null
	recyclingKey: string
	image: NitroImageType
	circular?: boolean | undefined
	width?: Token | number | undefined
	height?: Token | number | undefined
	testID?: string | undefined
}

function Image({
	itemId,
	recyclingKey,
	image,
	width,
	height,
	circular,
	testID,
}: ImageProps): React.JSX.Element {
	const imageStyle = StyleSheet.create({
		image: {
			borderRadius: width
				? getBorderRadius(circular, width)
				: circular
					? '100%'
					: getToken('$8'),
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

	return (
		<Animated.View entering={FadeIn} exiting={FadeOut}>
			<NitroImage
				recyclingKey={recyclingKey}
				key={itemId!}
				image={image}
				testID={testID}
				style={imageStyle.image}
			/>
		</Animated.View>
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
		borderRadius = typeof width === 'number' ? width / 10 : getTokenValue(width)
	}

	return borderRadius
}
