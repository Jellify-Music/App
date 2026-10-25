import React from 'react'
import { getTokenValue, SizeTokens, Token, CardProps as TamaguiCardProps, useTheme } from 'tamagui'
import { Card as TamaguiCard, YStack } from 'tamagui'
import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import useItemContext from '../../../../hooks/use-item-context'
import { usePerformanceMonitor } from '../../../../hooks/use-performance-monitor'
import ItemCardBackground from './background'
import ItemCardCaption from './caption'
import ItemCardFooter from './footer'
import { CardSizeToken } from './types'

interface CardProps extends Omit<TamaguiCardProps, 'size'> {
	caption?: string | null | undefined
	subCaption?: string | null | undefined
	item: BaseItemDto
	squared?: boolean
	captionAlign?: 'center' | 'left' | 'right'
	/** Single source of truth for the card's width/height; the caption is capped to the same width */
	size?: CardSizeToken
}

/**
 * Displays an item as a card.
 *
 * This is used on the Home Screen and in the Search and Library Tabs.
 *
 * @param props
 */
export default function ItemCard({
	caption,
	subCaption,
	item,
	squared,
	onPress,
	captionAlign = 'center',
	size = '10',
	...cardProps
}: CardProps) {
	usePerformanceMonitor('ItemCard', 2)

	const warmContext = useItemContext()

	const { darkBackground75 } = useTheme()

	const cardShadowStyle = {
		boxShadow: [
			{
				offsetY: 1,
				offsetX: 0,
				blurRadius: 2,
				spreadDistance: 0,
				color: darkBackground75.val,
			},
		],
	}

	const handlePressIn = () => (item.Type !== 'Audio' ? warmContext(item) : undefined)

	return (
		<YStack alignItems='center' paddingHorizontal='1'>
			<TamaguiCard
				width={size}
				height={size}
				borderRadius={squared ? '1' : '12'}
				transition='bouncy'
				scale={'1 hover:0.925 press: 0.875'}
				{...cardProps}
				style={cardShadowStyle}
				onPress={onPress}
				onPressIn={handlePressIn}
				overflow={'hidden'}
			>
				<ItemCardBackground item={item} squared={squared} />
				<ItemCardFooter type={item.Type ?? BaseItemKind.Audio} size={size} />
			</TamaguiCard>
			<ItemCardCaption
				captionAlign={captionAlign}
				caption={caption}
				subCaption={subCaption}
				width={size}
			/>
		</YStack>
	)
}
