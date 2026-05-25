import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import ItemKeyExtractor from '../../../utils/parsing/key-extractor'
import { LegendList, LegendListProps, LegendListRef } from '@legendapp/list'

type LegendItemListType = (string | number | BaseItemDto) | BaseItemDto

export default function LegendItemList<T extends LegendItemListType>(
	props: LegendListProps<T> & React.RefAttributes<LegendListRef>,
): React.JSX.Element {
	return <LegendList {...props} recycleItems keyExtractor={ItemKeyExtractor} />
}
