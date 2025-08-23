import React from 'react'
import { CardProps as TamaguiCardProps } from 'tamagui'
import { getToken, Card as TamaguiCard, View, YStack } from 'tamagui'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { Text } from '../helpers/text'
import ItemImage from './image'
import { warmItemContext } from '../../../hooks/use-item-context'
import { useJellifyContext } from '../../../providers'
import { useStreamingQualityContext } from '../../../providers/Settings'

interface CardProps extends TamaguiCardProps {
	caption?: string | null | undefined
	subCaption?: string | null | undefined
	item: BaseItemDto
	squared?: boolean
	testId?: string | null | undefined
}

/**
 * Displays an item as a card.
 *
 * This is used on the Home Screen and in the Search and Library Tabs.
 *
 * @param props
 */
export function ItemCard(props: CardProps) {
	const { api, user } = useJellifyContext()

	const streamingQuality = useStreamingQualityContext()

	return (
		<View alignItems='center' margin={'$1.5'}>
			<TamaguiCard
				size={'$12'}
				height={props.size}
				width={props.size}
				testID={props.testId ?? undefined}
				backgroundColor={getToken('$color.amethyst')}
				circular={!props.squared}
				borderRadius={props.squared ? '$5' : 'unset'}
				animation='bouncy'
				hoverStyle={props.onPress ? { scale: 0.925 } : {}}
				pressStyle={props.onPress ? { scale: 0.875 } : {}}
				onPressIn={() => warmItemContext(api, user, props.item, streamingQuality)}
				{...props}
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
					<ItemImage item={props.item} circular={!props.squared} />
				</TamaguiCard.Background>
			</TamaguiCard>
			{props.caption && (
				<YStack alignContent='center' alignItems='center' maxWidth={props.size}>
					<Text bold lineBreakStrategyIOS='standard' numberOfLines={1}>
						{props.caption}
					</Text>

					{props.subCaption && (
						<Text lineBreakStrategyIOS='standard' numberOfLines={1} textAlign='center'>
							{props.subCaption}
						</Text>
					)}
				</YStack>
			)}
		</View>
	)
}
