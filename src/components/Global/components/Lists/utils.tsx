import { ItemIdKeyExtractor, ItemKeyExtractor } from '../../../../utils/parsing/key-extractor'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { LegendList, LegendListProps, LegendListRef } from '@legendapp/list/react-native'
import { AnimatedLegendList, AnimatedLegendListProps } from '@legendapp/list/reanimated'
import { Ref } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { useReducedMotion } from 'react-native-reanimated'

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

export type AnimatedListProps<T extends ListType> = Omit<
	AnimatedLegendListProps<T>,
	'keyExtractor' | 'recycleItems'
>

/**
 * An animated variant of {@link List}, wrapping the {@link AnimatedLegendList} component
 * so items can use Reanimated layout animations via `itemLayoutAnimation`
 *
 * {@link AnimatedListProps.itemLayoutAnimation} controls the layout animation for each item in the list,
 * but will be disabled if the user has enabled reduced motion preferences.
 *
 * Items are keyed by {@link ItemIdKeyExtractor} so they keep their key when the list reorders,
 * which means the list must not contain the same item twice.
 *
 * @param param0 The props for the list component
 * @returns The rendered list component
 */
export function AnimatedList<T extends ListType>({
	data,
	horizontal,
	contentContainerStyle,
	itemLayoutAnimation,
	...props
}: AnimatedListProps<T>) {
	const reducedMotion = useReducedMotion()

	return (
		<AnimatedLegendList<T>
			data={data}
			horizontal={horizontal}
			keyExtractor={ItemIdKeyExtractor}
			recycleItems
			contentContainerStyle={getContentContainerStyle(horizontal, contentContainerStyle)}
			itemLayoutAnimation={reducedMotion ? undefined : itemLayoutAnimation}
			{...props}
		/>
	)
}
