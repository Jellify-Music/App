import React from 'react'
import { CardProps as TamaguiCardProps, useTheme } from 'tamagui'
import { Card as TamaguiCard, YStack } from 'tamagui'
import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import useItemContext from '../../../../hooks/use-item-context'
import { usePerformanceMonitor } from '../../../../hooks/use-performance-monitor'
import ItemCardBackground from './background'
import ItemCardCaption from './caption'
import ItemCardFooter from './footer'
import { CardSizeToken } from './types'
import { StyleSheet, View } from 'react-native'
import SnowCap from '../../../Holidays/snow-cap'
import { useHolidayTokens, useIsHolidays } from '../../../Holidays/hooks'

interface CardProps extends Omit<TamaguiCardProps, 'size'> {
	caption?: string | null | undefined
	subCaption?: string | null | undefined
	item: BaseItemDto
	squared?: boolean
	captionAlign?: 'center' | 'left' | 'right'
	/** Single source of truth for the card's width/height; the caption is capped to the same width */
	size?: CardSizeToken
	/** Drapes snow over the top of the artwork while the Holidays color scheme is active */
	snowCap?: boolean
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
	snowCap,
	...cardProps
}: CardProps) {
	usePerformanceMonitor('ItemCard', 2)

	const warmContext = useItemContext()
	const isHolidays = useIsHolidays()
	const holidayTokens = useHolidayTokens()

	const handlePressIn = () => (item.Type !== 'Audio' ? warmContext(item) : undefined)

	// Holidays: round artwork gets a gold ring, squared artwork a softer, deeper shadow
	const holidayShadow = squared
		? [{ offsetX: 0, offsetY: 4, blurRadius: 12, color: 'rgba(0, 0, 0, 0.3)' }]
		: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 2, color: holidayTokens.ring }]

	return (
		<YStack alignItems='center' marginHorizontal='1' marginTop='2'>
			<TamaguiCard
				width={size}
				height={size}
				borderRadius={squared ? '2' : '12'}
				transition='bouncy'
				scale={'1 hover:0.925 press: 0.875'}
				{...cardProps}
				onPress={onPress}
				onPressIn={handlePressIn}
				overflow={'hidden'}
				{...(isHolidays
					? { style: { boxShadow: holidayShadow } }
					: { boxShadow: '0 1px 8px black75' })}
			>
				<ItemCardBackground item={item} squared={squared} />
				<ItemCardFooter type={item.Type ?? BaseItemKind.Audio} size={size} />
			</TamaguiCard>
			{isHolidays && snowCap && (
				<View pointerEvents='none' style={styles.snowCap}>
					<SnowCap size='small' color={holidayTokens.cap} />
				</View>
			)}
			<ItemCardCaption
				captionAlign={captionAlign}
				caption={caption}
				subCaption={subCaption}
				width={size}
			/>
		</YStack>
	)
}

const styles = StyleSheet.create({
	// The design drapes the cap 6px above and 4px outside the artwork
	snowCap: {
		position: 'absolute',
		top: -6,
		left: -4,
	},
})
