import React, { useEffect, useMemo } from 'react'
import { CardProps as TamaguiCardProps } from 'tamagui'
import { getToken, Card as TamaguiCard, View, YStack } from 'tamagui'
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
	}, [item.Id])

	return (
		<View alignItems='center' margin={'$1.5'}>
			<TamaguiCard
				size={'$12'}
				height={cardProps.size}
				width={cardProps.size}
				testID={testId ?? undefined}
				backgroundColor={getToken('$color.amethyst')}
				circular={!squared}
				borderRadius={squared ? '$5' : 'unset'}
				animation='bouncy'
				onPress={onPress}
				onPressIn={() => {
					if (item.Type !== 'Audio') warmContext(item)
				}}
				hoverStyle={onPress ? { scale: 0.925 } : {}}
				pressStyle={onPress ? { scale: 0.875 } : {}}
				{...cardProps}
			>
				<TamaguiCard.Header></TamaguiCard.Header>
				<TamaguiCard.Footer padded>
					{/* { props.item.Type === 'MusicArtist' && (
					<BlurhashedImage
					cornered
					item={props.item}
					type={ImageType.Logo}
					width={logoDimensions.width}
					height={logoDimensions.height}
					/>
					)} */}
				</TamaguiCard.Footer>
				<TamaguiCard.Background>
					<ItemImage item={item} circular={!squared} />
				</TamaguiCard.Background>
			</TamaguiCard>
			{caption && (
				<YStack maxWidth={cardProps.size}>
					<Text
						bold
						lineBreakStrategyIOS='standard'
						width={cardProps.size}
						numberOfLines={1}
						textAlign={captionAlign}
					>
						{caption}
					</Text>

					{subCaption && (
						<Text
							lineBreakStrategyIOS='standard'
							width={cardProps.size}
							numberOfLines={1}
							textAlign={captionAlign}
						>
							{subCaption}
						</Text>
					)}
				</YStack>
			)}
		</View>
	)
}

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
		a.onPress === b.onPress,
)
