import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { FlashList, FlashListProps } from '@shopify/flash-list'
import React from 'react'

interface HorizontalCardListProps extends FlashListProps<BaseItemDto> {}

/**
 * Displays a Horizontal FlatList of 20 ItemCards
 * then shows a "See More" button
 * @param param0
 * @returns
 */
export default function HorizontalCardList({
	data,
	renderItem,
}: HorizontalCardListProps): React.JSX.Element {
	return (
		<FlashList
			horizontal
			data={data}
			renderItem={renderItem}
			removeClippedSubviews
			style={{
				overflow: 'hidden',
			}}
		/>
	)
}
