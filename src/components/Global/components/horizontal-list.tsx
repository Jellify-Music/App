import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { LegendListProps } from '@legendapp/list/react-native'
import React from 'react'
import List from '../helpers/list'

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
		<List<BaseItemDto>
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
