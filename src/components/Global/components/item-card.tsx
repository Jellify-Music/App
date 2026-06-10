import React from 'react'
import { Spacer, Square, CardProps as TamaguiCardProps, useTheme, View, ViewProps } from 'tamagui'
import { Card as TamaguiCard, YStack } from 'tamagui'
import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { Text } from '../helpers/text'
import ItemImage from './image'
import useItemContext from '../../../hooks/use-item-context'
import { usePerformanceMonitor } from '../../../hooks/use-performance-monitor'
import { getBlurhashFromDto } from '../../../utils/parsing/blurhash'
import MaterialDesignIcons, {
	MaterialDesignIconsIconName,
} from '@react-native-vector-icons/material-design-icons'
import { StyleSheet } from 'react-native'

const footerTypesNeedingIndicating: BaseItemKind[] = [
	BaseItemKind.MusicAlbum,
	BaseItemKind.Playlist,
]

interface CardProps extends TamaguiCardProps {
	caption?: string | null | undefined
	subCaption?: string | null | undefined
	item: BaseItemDto
	squared?: boolean
	captionAlign?: 'center' | 'left' | 'right'
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
	...cardProps
}: CardProps) {
	usePerformanceMonitor('ItemCard', 2)

	const warmContext = useItemContext()

	const hoverStyle = onPress ? { scale: 0.925 } : undefined

	const pressStyle = onPress ? { scale: 0.875 } : undefined

	const handlePressIn = () => (item.Type !== 'Audio' ? warmContext(item) : undefined)

	const blurhash = getBlurhashFromDto(item)

	const background = (
		<TamaguiCard.Background>
			<ItemImage
				item={item}
				customBlurhash={blurhash} // Pass blurhash here to reuse it as an image placeholder
				circular={!squared}
				width={cardProps.size}
				height={cardProps.size}
				imageOptions={{ maxWidth: 250, maxHeight: 250, quality: 100 }}
			/>
		</TamaguiCard.Background>
	)

	return (
		<YStack alignItems='center' margin={'$1.5'} gap={'$1'}>
			<TamaguiCard
				size={'$12'}
				height={cardProps.size}
				width={cardProps.size}
				borderRadius={squared ? '$6' : '$12'}
				transition='bouncy'
				onPress={onPress}
				onPressIn={handlePressIn}
				hoverStyle={hoverStyle}
				pressStyle={pressStyle}
				{...cardProps}
				elevation={'$2'}
			>
				<ItemCardComponentFooter type={item.Type ?? BaseItemKind.Audio} />
				{background}
			</TamaguiCard>
			<ItemCardComponentCaption
				size={cardProps.size ?? '$10'}
				captionAlign={captionAlign}
				caption={caption}
				subCaption={subCaption}
			/>
		</YStack>
	)
}

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
}

interface ItemCardComponentFooterProps {
	type: BaseItemKind
}

function ItemCardComponentFooter({ type }: ItemCardComponentFooterProps) {
	const theme = useTheme()

	const displayFooter = footerTypesNeedingIndicating.includes(type)

	const iconName: 'cassette' | 'disc' = type === BaseItemKind.Playlist ? 'cassette' : 'disc'

	return displayFooter ? (
		<TamaguiCard.Footer overflow='hidden'>
			<Spacer flexGrow={1} />

			<Square
				x={'$6'}
				y={'$6'}
				elevation={'$3'}
				backgroundColor={'$primary'}
				size={'$6'}
				rotate='45deg'
			>
				<View rotate='-45deg' {...offsets[iconName]}>
					<MaterialDesignIcons
						size={24}
						color={theme.background.val}
						name={iconName}
						style={styles[iconName]}
					/>
				</View>
			</Square>
		</TamaguiCard.Footer>
	) : null
}

const offsets = {
	cassette: {
		x: '$-4',
		y: '$',
	},
	disc: {
		x: '$-4',
		y: '$0',
	},
}

const styles = StyleSheet.create({
	cassette: {
		shadowColor: 'black',
		shadowRadius: 3,
		shadowOpacity: 0.1,
		shadowOffset: {
			height: 3,
			width: 0,
		},
	},
	disc: {
		shadowColor: 'black',
		shadowRadius: 3,
		shadowOpacity: 0.1,
		shadowOffset: {
			height: 3,
			width: 0,
		},
	},
})
