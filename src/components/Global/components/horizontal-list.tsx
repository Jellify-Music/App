import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { FlashList, FlashListProps } from '@shopify/flash-list'
import React from 'react'

type HorizontalCardListProps = Omit<FlashListProps<BaseItemDto>, 'estimatedItemSize'> & {
	estimatedItemSize?: number
}

/**
 * Displays a Horizontal FlatList of 20 ItemCards
 * then shows a "See More" button
 * @param param0
 * @returns
 */
export default function HorizontalCardList({
	data,
	renderItem,
	estimatedItemSize = 150,
	...props
}: HorizontalCardListProps): React.JSX.Element {
	return (
		<FlashList<BaseItemDto>
			horizontal
			data={data}
			renderItem={renderItem}
			removeClippedSubviews
			// @ts-expect-error - estimatedItemSize is required by FlashList but types are incorrect
			estimatedItemSize={estimatedItemSize}
			style={{
				overflow: 'hidden',
			}}
			{...props}
		/>
	)
}
