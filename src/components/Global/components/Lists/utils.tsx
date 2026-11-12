import { ItemKeyExtractor } from '../../../../utils/parsing/key-extractor'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { LegendList, LegendListProps, LegendListRef } from '@legendapp/list/react-native'
import { AnimatedLegendList, AnimatedLegendListProps } from '@legendapp/list/reanimated'
import { Ref } from 'react'
import { StyleProp, ViewStyle } from 'react-native'

type ListType = (BaseItemDto | string | number) | BaseItemDto

/**
 * Applies horizontal margins to vertical lists, keeping any style the caller passes
 */
function getContentContainerStyle(
	horizontal: boolean | null | undefined,
	contentContainerStyle: StyleProp<ViewStyle>,
): StyleProp<ViewStyle> {
	return [!horizontal && { marginHorizontal: 8 }, contentContainerStyle]
}

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
export default function List<T extends ListType>({
	horizontal,
	contentContainerStyle,
	...props
}: ListProps<T>) {
	return (
		<LegendList<T>
			horizontal={horizontal}
			{...props}
			keyExtractor={ItemKeyExtractor}
			recycleItems
			contentContainerStyle={getContentContainerStyle(horizontal, contentContainerStyle)}
		/>
	)
}

type AnimatedListProps<T extends ListType> = Omit<
	AnimatedLegendListProps<T>,
	'keyExtractor' | 'recycleItems'
>

/**
 * An animated variant of {@link List}, wrapping the {@link AnimatedLegendList} component
 * so items can use Reanimated layout animations via `itemLayoutAnimation`
 *
 * @param param0 The props for the list component
 * @returns The rendered list component
 */
export function AnimatedList<T extends ListType>({
	horizontal,
	contentContainerStyle,
	...props
}: AnimatedListProps<T>) {
	return (
		<AnimatedLegendList<T>
			horizontal={horizontal}
			{...props}
			keyExtractor={ItemKeyExtractor}
			recycleItems
			contentContainerStyle={getContentContainerStyle(horizontal, contentContainerStyle)}
		/>
	)
}
