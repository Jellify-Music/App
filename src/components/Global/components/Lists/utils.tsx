import { ItemIdKeyExtractor, ItemKeyExtractor } from '../../../../utils/parsing/key-extractor'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { LegendList, LegendListProps, LegendListRef } from '@legendapp/list/react-native'
import { AnimatedLegendList, AnimatedLegendListProps } from '@legendapp/list/reanimated'
import { Ref } from 'react'
import { useReducedMotion } from 'react-native-reanimated'

type ListType = (BaseItemDto | string | number) | BaseItemDto

type ListProps<T extends ListType> = Omit<LegendListProps<T>, 'keyExtractor' | 'recycleItems'> & {
	ref?: Ref<LegendListRef>
}

/**
 * A generic list component that wraps the {@link LegendList} component and provides
 * default key extraction from the {@link ItemKeyExtractor} and recycling behavior.
 *
 * This list component does not apply any spacing of its own, so rows, headers, and footers
 * are responsible for their own horizontal padding.
 *
 * @param param0 The props for the list component
 * @returns The rendered list component
 */
export default function List<T extends ListType>(props: ListProps<T>) {
	return <LegendList<T> {...props} keyExtractor={ItemKeyExtractor} recycleItems />
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
	itemLayoutAnimation,
	...props
}: AnimatedListProps<T>) {
	const reducedMotion = useReducedMotion()

	return (
		<AnimatedLegendList<T>
			{...props}
			keyExtractor={ItemIdKeyExtractor}
			recycleItems
			itemLayoutAnimation={reducedMotion ? undefined : itemLayoutAnimation}
		/>
	)
}
