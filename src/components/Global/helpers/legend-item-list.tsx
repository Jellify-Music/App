import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { LegendList, LegendListProps, LegendListRef } from '@legendapp/list/react-native'
import { ForwardedRef, forwardRef } from 'react'
import uuid from 'react-native-uuid'

type LegendListItemType = string | number | BaseItemDto

type LegendItemListProps<T extends LegendListItemType> = LegendListProps<T> & {
	ref?: ForwardedRef<LegendListRef>
}

export default function LegendItemList<T extends LegendListItemType>({
	ref,
	...props
}: LegendItemListProps<T>) {
	return <LegendList<T> ref={ref} keyExtractor={ItemKeyExtractor} {...props} />
}

export function ItemKeyExtractor(item: LegendListItemType) {
	return typeof item === 'object' ? (item.Id ?? uuid.v4().toString()) : item.toString()
}
