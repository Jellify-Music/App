import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { LegendList, LegendListProps } from '@legendapp/list'
import React from 'react'

type HorizontalCardListProps = LegendListProps<BaseItemDto>

/**
 * Displays a Horizontal FlatList of 20 ItemCards
 * then shows a "See More" button
 * @param param0
 * @returns
 */
export default function HorizontalCardList(props: HorizontalCardListProps): React.JSX.Element {
	return (
		<LegendList
			horizontal
			style={{
				overflow: 'hidden',
			}}
			{...props}
		/>
	)
}
