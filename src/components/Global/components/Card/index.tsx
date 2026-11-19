import React from 'react'
import { CardProps as TamaguiCardProps } from 'tamagui'
import { Card as TamaguiCard, YStack } from 'tamagui'
import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import warmItemContext from '../../../../utils/fetching/item-context'
import { usePerformanceMonitor } from '../../../../hooks/use-performance-monitor'
import ItemCardBackground from './background'
import ItemCardCaption from './caption'
import ItemCardFooter from './footer'
import { CardCaptionAlign, CardSizeToken } from './types'

interface CardProps extends Omit<TamaguiCardProps, 'size'> {
	caption?: string | null | undefined
	subCaption?: string | null | undefined
	item: BaseItemDto
	captionAlign?: CardCaptionAlign
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
	onPress,
	captionAlign = 'center',
	size = '10',
	...cardProps
}: CardProps) {
	usePerformanceMonitor('ItemCard', 2)

	const squared = item.Type !== BaseItemKind.MusicArtist

	return (
		<YStack alignItems='center' gap='1' marginHorizontal='1' paddingTop='2'>
			<TamaguiCard
				{...cardProps}
				width={size}
				height={size}
				borderRadius={squared ? '2' : '12'}
				transition='bouncy'
				scale={'1 hover:0.925 press: 0.875'}
				onPress={onPress}
				onPressIn={() => warmItemContext(item)}
				overflow={'hidden'}
				boxShadow='0 1px 10px black75'
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
