import { warmItemContext } from '../../../hooks/use-item-context'
import { useJellifyContext } from '../../../providers'
import { useStreamingQualityContext } from '../../../providers/Settings'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { FlashList, FlashListProps, ViewToken } from '@shopify/flash-list'
import React, { useRef } from 'react'

interface HorizontalCardListProps extends FlashListProps<BaseItemDto> {}

/**
 * Displays a Horizontal FlatList of 20 ItemCards
 * then shows a "See More" button
 * @param param0
 * @returns
 */
export default function HorizontalCardList({
	...props
}: HorizontalCardListProps): React.JSX.Element {
	const { api, user } = useJellifyContext()

	const streamingQuality = useStreamingQualityContext()

	const onViewableItemsChangedRef = useRef(
		({ viewableItems }: { viewableItems: ViewToken<BaseItemDto>[] }) => {
			viewableItems.forEach(({ isViewable, item }) => {
				if (isViewable) warmItemContext(api, user, item, streamingQuality)
			})
		},
	)

	return (
		<FlashList
			horizontal
			data={props.data}
			onViewableItemsChanged={onViewableItemsChangedRef.current}
			renderItem={props.renderItem}
			removeClippedSubviews
			style={{
				overflow: 'hidden',
			}}
		/>
	)
}
