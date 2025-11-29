import React, { memo, useCallback, useEffect, useMemo } from 'react'
import { CardProps as TamaguiCardProps } from 'tamagui'
import { Card as TamaguiCard, View, YStack } from 'tamagui'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { Text } from '../helpers/text'
import ItemImage from './image'
import useItemContext from '../../../hooks/use-item-context'
import { usePerformanceMonitor } from '../../../hooks/use-performance-monitor'

interface CardProps extends TamaguiCardProps {
	caption?: string | null | undefined
	subCaption?: string | null | undefined
	item: BaseItemDto
	squared?: boolean
	testId?: string | null | undefined
	captionAlign?: 'center' | 'left' | 'right'
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

	useEffect(() => {
		if (item.Type === 'Audio') warmContext(item)
	}, [item.Id, warmContext])

	const hoverStyle = useMemo(() => (onPress ? { scale: 0.925 } : undefined), [onPress])

	const pressStyle = useMemo(() => (onPress ? { scale: 0.875 } : undefined), [onPress])

	const handlePressIn = useCallback(
		() => (item.Type !== 'Audio' ? warmContext(item) : undefined),
		[item.Id, warmContext],
	)

	const background = useMemo(
		() => (
			<TamaguiCard.Background>
				<ItemImage item={item} circular={!squared} />
			</TamaguiCard.Background>
		),
		[item.Id, squared],
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

export const ItemCard = React.memo(
	ItemCardComponent,
	(a, b) =>
		a.item.Id === b.item.Id &&
		a.item.Type === b.item.Type &&
		a.caption === b.caption &&
		a.subCaption === b.subCaption &&
		a.squared === b.squared &&
		a.size === b.size &&
		a.testId === b.testId &&
		!!a.onPress === !!b.onPress &&
		a.captionAlign === b.captionAlign,
)
