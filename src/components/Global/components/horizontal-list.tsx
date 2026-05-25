import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { LegendListProps } from '@legendapp/list'
import React from 'react'
import LegendItemList from '../helpers/legend-item-list'

type HorizontalCardListProps = LegendListProps<BaseItemDto>

/**
 * Displays a Horizontal FlatList of 20 ItemCards
 * then shows a "See More" button
 * @param param0
 * @returns
 */
export default function HorizontalCardList(props: HorizontalCardListProps): React.JSX.Element {
	return (
		<LegendItemList
			horizontal
			style={{
				overflow: 'hidden',
			}}
			{...props}
		/>
	)
}
