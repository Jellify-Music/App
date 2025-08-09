import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { isUndefined } from 'lodash'
import { getTokenValue, Token } from 'tamagui'
import { useJellifyContext } from '../../../providers'
import { ImageStyle } from 'react-native'
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { Image, NitroImage, useImage } from 'react-native-nitro-image'
import { Api } from '@jellyfin/sdk'
import { Blurhash } from 'react-native-blurhash'
import { extractBlurhashFromDto } from '../../../utils/blurhash'
import { useCallback } from 'react'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { WebImages } from 'react-native-nitro-web-image'
import { QueryKeys } from '../../../enums/query-keys'
import QueryConfig from '../../../api/queries/query.config'
import { useQuery } from '@tanstack/react-query'

interface ImageProps {
	item: BaseItemDto
	circular?: boolean | undefined
	width?: Token | number | undefined
	height?: Token | number | undefined
	style?: ImageStyle | undefined
	testID?: string | undefined
	imageType?: ImageType
}

export default function ItemImage({
	item,
	circular,
	width,
	height,
	style,
	testID,
	imageType = ImageType.Primary,
}: ImageProps): React.JSX.Element {
	const { api } = useJellifyContext()

	const blurhash = useCallback(() => extractBlurhashFromDto(item, imageType), [item, imageType])

	const { image } = useImage({ url: fetchImageUrl(api!, item, imageType) })

	return (
		<Animated.View entering={FadeIn.duration(500)} exiting={FadeOut.duration(500)}>
			{!isUndefined(image)
				? renderImage(image, width, height, imageType, testID, circular)
				: renderBlurhash(blurhash(), width, height, imageType, testID, circular)}
		</Animated.View>
	)
}

function renderBlurhash(
	blurhash: string | undefined,
	width: Token | number | undefined,
	height: Token | number | undefined,
	imageType: ImageType,
	testID: string | undefined,
	circular: boolean | undefined,
): React.JSX.Element {
	return (
		<Blurhash
			blurhash={blurhash!}
			style={{
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
				borderRadius:
					imageType === ImageType.Backdrop ? 0 : getBorderRadius(circular, width),
				overflow: 'hidden',
			}}
		/>
	)
}

function renderImage(
	image: Image,
	width: Token | number | undefined,
	height: Token | number | undefined,
	imageType: ImageType,
	testID: string | undefined,
	circular: boolean | undefined,
): React.JSX.Element {
	return (
		<NitroImage
			key={`${testID}-${circular}-${imageType}`}
			recyclingKey={`${testID}-${circular}-${imageType}`}
			resizeMode={imageType === ImageType.Backdrop ? 'cover' : 'contain'}
			image={image}
			testID={testID}
			style={{
				shadowRadius: getTokenValue('$4'),
				shadowOffset: {
					width: 0,
					height: -getTokenValue('$4'),
				},
				shadowColor: getTokenValue('$darkBackground'),
				borderRadius:
					imageType === ImageType.Backdrop ? 0 : getBorderRadius(circular, width),
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
		borderRadius = width ? (typeof width === 'number' ? width : getTokenValue(width)) : '100%'
	} else if (!isUndefined(width)) {
		borderRadius = typeof width === 'number' ? width / 16 : getTokenValue(width) / 16
	} else borderRadius = getTokenValue('$4')

	return borderRadius
}

/**
 * Fetches an image URL for a given item and image type
 * @param api - The {@link Api} client
 * @param item - The {@link BaseItemDto}
 * @param imageType - The {@link ImageType}
 * @returns The image URL
 */
function fetchImageUrl(api: Api, item: BaseItemDto, imageType: ImageType): string {
	const { AlbumId, Id, ImageTags } = item

	if (AlbumId) {
		return getImageApi(api).getItemImageUrlById(AlbumId, imageType, {
			tag: ImageTags?.[imageType],
		})
	}

	return getImageApi(api).getItemImageUrlById(Id!, imageType, {
		tag: ImageTags?.[imageType],
	})
}
