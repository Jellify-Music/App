import React from 'react'
import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { XStack, XStackProps } from 'tamagui'
import { LayoutChangeEvent } from 'react-native'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import ItemImage from '../image'
import { useSwipeableRowContext } from './context'

interface HideableArtworkProps extends Omit<XStackProps, 'onLayout'> {
	item: BaseItemDto
	circular?: boolean
	onLayout?: (event: LayoutChangeEvent) => void
}

/**
 * Artwork wrapper that fades out when the quick-action menu of the
 * surrounding {@link SwipeableRow} is open.
 *
 * Any additional {@link XStackProps} are applied to the container around the image,
 * which defaults to a right margin of `2`.
 */
export default function HideableArtwork({
	item,
	circular,
	onLayout,
	...containerProps
}: HideableArtworkProps): React.JSX.Element {
	const { tx } = useSwipeableRowContext()
	// Hide artwork as soon as swiping starts (any non-zero tx)
	const style = useAnimatedStyle(() => ({
		opacity: withTiming(tx.value === 0 ? 1 : 0),
	}))
	return (
		<Animated.View style={style} onLayout={onLayout}>
			<XStack marginRight='2' marginVertical={'auto'} alignItems='center' {...containerProps}>
				<ItemImage
					item={item}
					height={'4'}
					width={'4'}
					elevate
					circular={item.Type === BaseItemKind.MusicArtist || circular}
					imageOptions={{ maxWidth: 140, maxHeight: 140, quality: 90 }}
				/>
			</XStack>
		</Animated.View>
	)
}
