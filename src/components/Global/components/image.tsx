import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { isEmpty, isUndefined } from 'lodash'
import { getToken, getTokenValue, Token } from 'tamagui'
import { useJellifyContext } from '../../../providers'
import { ImageStyle, StyleSheet } from 'react-native'
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { useEffect, useMemo } from 'react'
import { NitroImage, useImage, useImageLoader } from 'react-native-nitro-image'
import { Blurhash } from 'react-native-blurhash'
import { getBlurhashFromDto } from '../../../utils/blurhash'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

interface ItemImageProps {
	item: BaseItemDto
	type?: ImageType
	circular?: boolean | undefined
	width?: Token | number | undefined
	height?: Token | number | undefined
	style?: ImageStyle | undefined
	testID?: string | undefined
}

export default function ItemImage({
	item,
	type = ImageType.Primary,
	circular,
	width,
	height,
	style,
	testID,
}: ItemImageProps): React.JSX.Element {
	const { api } = useJellifyContext()

	const imageUrl = useMemo(() => {
		const { AlbumId, ImageTags, Id } = item

		if (!api) return undefined

		return AlbumId
			? getImageApi(api).getItemImageUrlById(AlbumId, type, {
					tag: ImageTags ? ImageTags[type] : undefined,
				})
			: Id
				? getImageApi(api).getItemImageUrlById(Id, ImageType.Primary, {
						tag: ImageTags ? ImageTags[type] : undefined,
					})
				: undefined
	}, [api, item])

	const blurhash = useMemo(() => getBlurhashFromDto(item), [item])

	useEffect(() => {
		console.debug(`Image URL: ${imageUrl}`)
	}, [imageUrl])

	return api && imageUrl?.includes(api.basePath) && !isEmpty(blurhash) ? (
		<Image
			imageUrl={imageUrl}
			blurhash={blurhash}
			testID={testID}
			height={height}
			width={width}
			circular={circular}
		/>
	) : (
		<></>
	)
}

interface ImageProps {
	imageUrl: string
	blurhash: string
	circular?: boolean | undefined
	width?: Token | number | undefined
	height?: Token | number | undefined
	testID?: string | undefined
}

function Image({
	imageUrl,
	blurhash,
	width,
	height,
	circular,
	testID,
}: ImageProps): React.JSX.Element {
	const { imageStyle } = StyleSheet.create({
		imageStyle: {
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

	const imageloader = useImageLoader({ url: imageUrl })

	return imageloader ? (
		<Animated.View entering={FadeIn} exiting={FadeOut}>
			<NitroImage
				recyclingKey={imageUrl}
				image={imageloader}
				testID={testID}
				style={imageStyle}
			/>
		</Animated.View>
	) : (
		<Blurhash blurhash={blurhash} style={imageStyle} testID={testID} />
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
		borderRadius = typeof width === 'number' ? width / 10 : getTokenValue(width) / 10
	}

	return borderRadius
}
