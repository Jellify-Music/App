import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { LegendListProps } from '@legendapp/list/react-native'
import React from 'react'
import List from './Lists/utils'
import { StyleSheet } from 'react-native'
import { useDisplayContext } from '../../../providers/Display/display-provider'

type HorizontalCardListProps = LegendListProps<BaseItemDto> & {
	slice?: boolean
}

/**
 * Displays a horizontal list of ItemCards
 *
 * @param slice Whether to cap the list at the display's `horizontalItems`
 * (15, or 30 on wide screens). Defaults to `true` - pass `false` to show every item
 */
export default function HorizontalCardList({
	data,
	renderItem,
	estimatedItemSize = 150,
	slice = true,
	...props
}: HorizontalCardListProps): React.JSX.Element {
	const { horizontalItems } = useDisplayContext()

	return (
		<List<BaseItemDto>
			horizontal
			data={slice ? data?.slice(0, horizontalItems) : data}
			renderItem={renderItem}
			estimatedItemSize={estimatedItemSize}
			recycleItems
			style={styles.list}
			{...props}
		/>
	)
}

const styles = StyleSheet.create({
	list: {
		overflow: 'hidden',
		paddingLeft: 5,
	},
})
