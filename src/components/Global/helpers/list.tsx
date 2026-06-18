import { ItemKeyExtractor } from '../../../utils/parsing/key-extractor'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { LegendList, LegendListProps, LegendListRef } from '@legendapp/list/react-native'
import { Ref } from 'react'

type ListType = (BaseItemDto | string | number) | BaseItemDto

type ListProps<T extends ListType> = Omit<LegendListProps<T>, 'keyExtractor' | 'recycleItems'> & {
	ref?: Ref<LegendListRef>
}

export default function List<T extends ListType>(props: ListProps<T>) {
	return <LegendList<T> {...props} keyExtractor={ItemKeyExtractor} recycleItems />
}
