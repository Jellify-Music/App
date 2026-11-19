import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { LinearTransition } from 'react-native-reanimated'
import React from 'react'
import { AnimatedList, AnimatedListProps } from './Lists/utils'
import { StyleSheet } from 'react-native'
import { useDisplayContext } from '../../../providers/Display/display-provider'

// Cards slide to their new positions when a refresh reorders the list
const itemLayoutAnimation = LinearTransition.springify()

type HorizontalCardListProps = AnimatedListProps<BaseItemDto> & {
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
	estimatedItemSize = 100,
	slice = true,
	...props
}: HorizontalCardListProps): React.JSX.Element {
	const { horizontalItems } = useDisplayContext()

	const slicedData = slice ? data?.slice(0, horizontalItems) : data

	return (
		<AnimatedList<BaseItemDto>
			horizontal
			data={slicedData}
			renderItem={renderItem}
			estimatedItemSize={estimatedItemSize}
			itemLayoutAnimation={itemLayoutAnimation}
			contentContainerStyle={styles.contentContainer}
			style={styles.list}
			{...props}
		/>
	)
}

const styles = StyleSheet.create({
	list: {
		overflow: 'hidden',
	},
	contentContainer: {
		paddingHorizontal: 4,
	},
})
