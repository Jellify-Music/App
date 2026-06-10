import { UseInfiniteQueryResult } from '@tanstack/react-query'
import List from '../helpers/list'
import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { RefreshControl } from 'react-native'
import { LegendListRenderItemProps } from '@legendapp/list/react-native'
import ItemRow from './item-row'
import { Queue } from '@/src/services/types/queue-item'

interface ItemListProps {
	query: UseInfiniteQueryResult<BaseItemDto[], Error>
	queue?: Queue
}

export default function ItemList({ query }: ItemListProps): React.JSX.Element {
	const renderItem = ({ item, index }: LegendListRenderItemProps<BaseItemDto>) => (
		<ItemRow
			circular={item.Type === BaseItemKind.MusicArtist}
			item={item}
			testID={`${item.Type?.toLowerCase()}-item-${index}`}
		/>
	)

	const onEndReached = () => query.hasNextPage && query.fetchNextPage()

	return (
		<List
			data={[]}
			refreshControl={
				<RefreshControl refreshing={query.isPending} onRefresh={query.refetch} />
			}
			renderItem={renderItem}
			onEndReached={onEndReached}
		/>
	)
}
