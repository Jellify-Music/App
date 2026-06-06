import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { LegendList, LegendListProps } from '@legendapp/list/react-native'
import React from 'react'

type HorizontalCardListProps = LegendListProps<BaseItemDto>

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
		<LegendList<BaseItemDto>
			horizontal
			data={data}
			renderItem={renderItem}
			estimatedItemSize={estimatedItemSize}
			recycleItems
			style={{
				overflow: 'hidden',
			}}
			{...props}
		/>
	)
}
