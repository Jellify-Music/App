import React, { memo, useCallback, useEffect, useMemo } from 'react'
import { CardProps as TamaguiCardProps } from 'tamagui'
import { Card as TamaguiCard, View, YStack } from 'tamagui'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { Text } from '../helpers/text'
import ItemImage from './image'
import useItemContext from '../../../hooks/use-item-context'
import { usePerformanceMonitor } from '../../../hooks/use-performance-monitor'
import { UnifiedItem } from '../../../api/core/types'
import { isUnifiedItem, normalizeToDto } from '../../../utils/unified-mappings'

interface CardProps extends TamaguiCardProps {
	caption?: string | null | undefined
	subCaption?: string | null | undefined
	/** The item to display - supports both unified types and legacy BaseItemDto */
	item: UnifiedItem | BaseItemDto
	squared?: boolean
	testId?: string | null | undefined
	captionAlign?: 'center' | 'left' | 'right'
}

/**
 * Get the ID from either a UnifiedItem or BaseItemDto.
 */
function getItemId(item: UnifiedItem | BaseItemDto): string | undefined {
	if ('id' in item) return item.id
	return item.Id
}

/**
 * Get the type from either a UnifiedItem or BaseItemDto.
 * Returns 'Audio' for tracks, undefined for other unified types.
 */
function getItemType(item: UnifiedItem | BaseItemDto): string | undefined {
	if (isUnifiedItem(item)) {
		// Check if it's a track by looking for albumId (tracks have albumId)
		if ('albumId' in item && 'artistId' in item && 'duration' in item) {
			return 'Audio'
		}
		return undefined
	}
	return item.Type
}

/**
 * Displays an item as a card.
 *
 * This is used on the Home Screen and in the Search and Library Tabs.
 *
 * @param props
 */
function ItemCardComponent({
	caption,
	subCaption,
	item,
	squared,
	testId,
	onPress,
	captionAlign = 'center',
	...cardProps
}: CardProps) {
	usePerformanceMonitor('ItemCard', 2)

	const warmContext = useItemContext()

	// Get ID and type that works with both item types
	const itemId = useMemo(() => getItemId(item), [item])
	const itemType = useMemo(() => getItemType(item), [item])

	// Normalize for legacy code paths that need BaseItemDto
	const normalizedItem = useMemo(() => normalizeToDto(item), [item])

	useEffect(() => {
		if (itemType === 'Audio') warmContext(normalizedItem)
	}, [itemId, itemType, warmContext, normalizedItem])

	const hoverStyle = useMemo(() => (onPress ? { scale: 0.925 } : undefined), [onPress])

	const pressStyle = useMemo(() => (onPress ? { scale: 0.875 } : undefined), [onPress])

	const handlePressIn = useCallback(
		() => (itemType !== 'Audio' ? warmContext(normalizedItem) : undefined),
		[itemId, warmContext, normalizedItem, itemType],
	)

	const background = useMemo(
		() => (
			<TamaguiCard.Background>
				<ItemImage item={item} circular={!squared} />
			</TamaguiCard.Background>
		),
		[itemId, squared, item],
	)

	return (
		<View alignItems='center' margin={'$1.5'}>
			<TamaguiCard
				size={'$12'}
				height={cardProps.size}
				width={cardProps.size}
				testID={testId ?? undefined}
				backgroundColor={'$neutral'}
				circular={!squared}
				borderRadius={squared ? '$5' : 'unset'}
				animation='bouncy'
				onPress={onPress}
				onPressIn={handlePressIn}
				hoverStyle={hoverStyle}
				pressStyle={pressStyle}
				{...cardProps}
			>
				{background}
			</TamaguiCard>
			<ItemCardComponentCaption
				size={cardProps.size ?? '$10'}
				captionAlign={captionAlign}
				caption={caption}
				subCaption={subCaption}
			/>
		</View>
	)
}

const ItemCardComponentCaption = memo(
	function ItemCardComponentCaption({
		size,
		captionAlign = 'center',
		caption,
		subCaption,
	}: {
		size: string | number
		captionAlign: 'center' | 'left' | 'right'
		caption?: string | null | undefined
		subCaption?: string | null | undefined
	}): React.JSX.Element | null {
		if (!caption) return null

		return (
			<YStack maxWidth={size}>
				<Text
					bold
					lineBreakStrategyIOS='standard'
					width={size}
					numberOfLines={1}
					textAlign={captionAlign}
				>
					{caption}
				</Text>

				{subCaption && (
					<Text
						lineBreakStrategyIOS='standard'
						width={size}
						numberOfLines={1}
						textAlign={captionAlign}
					>
						{subCaption}
					</Text>
				)}
			</YStack>
		)
	},
	(prevProps, nextProps) =>
		prevProps.size === nextProps.size &&
		prevProps.captionAlign === nextProps.captionAlign &&
		prevProps.caption === nextProps.caption &&
		prevProps.subCaption === nextProps.subCaption,
)

export const ItemCard = React.memo(ItemCardComponent, (a, b) => {
	const aId = getItemId(a.item)
	const bId = getItemId(b.item)
	const aType = getItemType(a.item)
	const bType = getItemType(b.item)
	return (
		aId === bId &&
		aType === bType &&
		a.caption === b.caption &&
		a.subCaption === b.subCaption &&
		a.squared === b.squared &&
		a.size === b.size &&
		a.testId === b.testId &&
		!!a.onPress === !!b.onPress &&
		a.captionAlign === b.captionAlign
	)
})
