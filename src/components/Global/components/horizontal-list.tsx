import useStreamingDeviceProfile from '../../../stores/device-profile'
import { useJellifyContext } from '../../../providers'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { FlashList, FlashListProps, ViewToken } from '@shopify/flash-list'
import React from 'react'

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

	const deviceProfile = useStreamingDeviceProfile()

	return (
		<FlashList
			horizontal
			data={props.data}
			renderItem={props.renderItem}
			removeClippedSubviews
			style={{
				overflow: 'hidden',
			}}
		/>
	)
}
