import { ItemKeyExtractor } from '../../../../utils/parsing/key-extractor'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { LegendList, LegendListProps, LegendListRef } from '@legendapp/list/react-native'
import { Ref } from 'react'

type ListType = (BaseItemDto | string | number) | BaseItemDto

type ListProps<T extends ListType> = Omit<LegendListProps<T>, 'keyExtractor' | 'recycleItems'> & {
	ref?: Ref<LegendListRef>
}

/**
 * A generic list component that wraps the {@link LegendList} component and provides
 * default key extraction from the {@link ItemKeyExtractor} and recycling behavior.
 *
 * This list component automatically applies flex and margin styles for vertical lists only, ensuring that
 * horizontal lists are not affected by these styles and behave as expected.
 *
 * @param param0 The props for the list component
 * @returns The rendered list component
 */
export default function List<T extends ListType>({ horizontal, ...props }: ListProps<T>) {
	const contentContainerStyle = horizontal
		? undefined
		: {
				margin: 4,
			}

	return (
		<LegendList<T>
			horizontal={horizontal}
			{...props}
			keyExtractor={ItemKeyExtractor}
			recycleItems
			contentContainerStyle={contentContainerStyle}
		/>
	)
}
