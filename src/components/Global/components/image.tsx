import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { isUndefined } from 'lodash'
import { getTokenValue, Token, Image as TamaguiImage, ZStack } from 'tamagui'
import { StyleSheet } from 'react-native'
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { Blurhash } from 'react-native-blurhash'
import { getBlurhashFromDto } from '../../../utils/blurhash'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import {
	getItemImageUrl,
	getCoverArtUrlForItem,
	ImageUrlOptions,
} from '../../../api/queries/image/utils'
import { memo, useCallback, useMemo, useState } from 'react'
import { useApi, useAdapter, useJellifyServer } from '../../../stores'
import { UnifiedItem } from '../../../api/core/types'
import { isUnifiedItem, normalizeToDto } from '../../../utils/unified-mappings'

interface ItemImageProps {
	/** The item to display - supports both unified types and legacy BaseItemDto */
	item: UnifiedItem | BaseItemDto
	type?: ImageType
	cornered?: boolean | undefined
	circular?: boolean | undefined
	width?: Token | number | string | undefined
	height?: Token | number | string | undefined
	testID?: string | undefined
	/** Image resolution options for requesting higher quality images */
	imageOptions?: ImageUrlOptions
}

const ItemImage = memo(
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
		const adapter = useAdapter()
		const [server] = useJellifyServer()
		const isNavidrome = server?.backend === 'navidrome'

		// Normalize item for legacy code paths that need BaseItemDto
		const normalizedItem = useMemo(() => normalizeToDto(item), [item])

		const imageUrl = useMemo(() => {
			// Use adapter for Navidrome or unified types, Jellyfin SDK for Jellyfin BaseItemDto
			if (isNavidrome || isUnifiedItem(item)) {
				return getCoverArtUrlForItem(adapter, item, imageOptions)
			}
			return getItemImageUrl(api, normalizedItem, type, imageOptions)
		}, [api, adapter, isNavidrome, item, normalizedItem, type, imageOptions])

		// Get item ID for key/comparison (works with both types)
		const itemId = useMemo(() => {
			if ('id' in item) return item.id
			return item.Id
		}, [item])

		return imageUrl ? (
			<Image
				item={normalizedItem}
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
	},
	(prevProps, nextProps) => {
		// Handle both unified and BaseItemDto for memoization
		const prevId = 'id' in prevProps.item ? prevProps.item.id : prevProps.item.Id
		const nextId = 'id' in nextProps.item ? nextProps.item.id : nextProps.item.Id
		return (
			prevId === nextId &&
			prevProps.type === nextProps.type &&
			prevProps.cornered === nextProps.cornered &&
			prevProps.circular === nextProps.circular &&
			prevProps.width === nextProps.width &&
			prevProps.height === nextProps.height &&
			prevProps.testID === nextProps.testID &&
			prevProps.imageOptions?.maxWidth === nextProps.imageOptions?.maxWidth &&
			prevProps.imageOptions?.maxHeight === nextProps.imageOptions?.maxHeight &&
			prevProps.imageOptions?.quality === nextProps.imageOptions?.quality
		)
	},
)

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

const ItemBlurhash = memo(
	function ItemBlurhash({ item, type }: ItemBlurhashProps): React.JSX.Element {
		const blurhash = getBlurhashFromDto(item, type)

		return (
			<Animated.View style={Styles.blurhash} entering={FadeIn} exiting={FadeOut}>
				<Blurhash resizeMode={'cover'} style={Styles.blurhashInner} blurhash={blurhash} />
			</Animated.View>
		)
	},
	(prevProps: ItemBlurhashProps, nextProps: ItemBlurhashProps) =>
		prevProps.item.Id === nextProps.item.Id && prevProps.type === nextProps.type,
)

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

const Image = memo(
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

		const imageViewStyle = useMemo(
			() => getImageStyleSheet(width, height, cornered, circular),
			[cornered, circular, width, height],
		)

		const imageSource = useMemo(() => ({ uri: imageUrl }), [imageUrl])

		const blurhash = useMemo(
			() => (!isLoaded ? <ItemBlurhash item={item} type={type} /> : null),
			[isLoaded],
		)

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
	},
	(prevProps, nextProps) => {
		return (
			prevProps.imageUrl === nextProps.imageUrl &&
			prevProps.type === nextProps.type &&
			prevProps.item.Id === nextProps.item.Id &&
			prevProps.cornered === nextProps.cornered &&
			prevProps.circular === nextProps.circular &&
			prevProps.width === nextProps.width &&
			prevProps.height === nextProps.height &&
			prevProps.testID === nextProps.testID
		)
	},
)

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
