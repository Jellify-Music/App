import { UseInfiniteQueryResult } from '@tanstack/react-query'
import List from '../helpers/list'
import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { RefreshControl } from 'react-native'
import { LegendListRenderItemProps } from '@legendapp/list/react-native'
import ItemRow from './item-row'
import { Queue } from '@/src/services/types/queue-item'
import Track from './Track'

interface ItemListProps {
	query: UseInfiniteQueryResult<BaseItemDto[], Error>
	queue?: Queue
}

export default function ItemList({ query, queue }: ItemListProps): React.JSX.Element {
	const tracks = query.data?.filter(({ Type }) => Type === BaseItemKind.Audio) ?? []

	const renderItem = ({ item, index }: LegendListRenderItemProps<BaseItemDto>) =>
		item.Type === BaseItemKind.Audio ? (
			<Track
				showArtwork
				index={0}
				track={item}
				testID={`track-item-${index}`}
				tracklist={tracks.slice(tracks.indexOf(item), tracks.indexOf(item) + 50)}
				queue={queue ?? 'Library'}
			/>
		) : (
			<ItemRow
				circular={item.Type === BaseItemKind.MusicArtist}
				item={item}
				testID={`${item.Type?.toLowerCase()}-item-${index}`}
			/>
		)

	const onEndReached = () => query.hasNextPage && query.fetchNextPage()

	return (
		<List
			data={query.data ?? []}
			refreshControl={
				<RefreshControl refreshing={query.isPending} onRefresh={query.refetch} />
			}
			renderItem={renderItem}
			onEndReached={onEndReached}
		/>
	)
}
