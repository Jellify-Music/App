import {
	UseInfiniteQueryResult,
	UseQueryResult,
	InfiniteQueryObserverResult,
} from '@tanstack/react-query'
import List from './utils'
import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { RefreshControl } from 'react-native'
import { LegendListRenderItemProps } from '@legendapp/list/react-native'
import ItemRow from '../item-row'
import { Queue } from '../../../../services/types/queue-item'
import Track from '../Track'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../../../../screens/types'
import { EventHandler } from '../../../../types/Events'

interface InfiniteItemListProps {
	infiniteQuery: UseInfiniteQueryResult<BaseItemDto[], Error>
	queue?: Queue
}

export default function InfiniteItemList({
	infiniteQuery,
	queue,
}: InfiniteItemListProps): React.JSX.Element {
	const onEndReached = () =>
		infiniteQuery.hasNextPage ? infiniteQuery.fetchNextPage() : undefined

	return <BaseItemList query={infiniteQuery} queue={queue} onEndReached={onEndReached} />
}

interface ItemListProps {
	query: UseQueryResult<BaseItemDto[], Error>
	queue?: Queue
}

export function ItemList({ query, queue }: ItemListProps): React.JSX.Element {
	return <BaseItemList query={query} queue={queue} />
}

interface BaseItemListProps {
	query: UseQueryResult<BaseItemDto[], Error> | UseInfiniteQueryResult<BaseItemDto[], Error>
	queue?: Queue
	onEndReached?: EventHandler<InfiniteQueryObserverResult<BaseItemDto[], Error> | undefined>
}

function BaseItemList({ query, queue, onEndReached }: BaseItemListProps): React.JSX.Element {
	const tracks = query.data?.filter(({ Type }) => Type === BaseItemKind.Audio) ?? []
	const trackIds = new Map<string, number>(tracks.map((track, index) => [track.Id!, index]))

	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()

	const renderItem = ({ item, index }: LegendListRenderItemProps<BaseItemDto>) => {
		const trackIndex = trackIds.get(item.Id!) ?? 0

		return item.Type === BaseItemKind.Audio ? (
			<Track
				navigation={navigation}
				showArtwork
				index={0}
				track={item}
				testID={`track-item-${index}`}
				tracklist={tracks.slice(trackIndex, trackIndex + 50)}
				queue={queue ?? 'Library'}
			/>
		) : (
			<ItemRow
				circular={item.Type === BaseItemKind.MusicArtist}
				item={item}
				testID={`${item.Type?.toLowerCase()}-item-${index}`}
			/>
		)
	}

	const onRefresh = async () => {
		await query.refetch()
	}

	return (
		<List
			data={query.data ?? []}
			refreshControl={<RefreshControl refreshing={query.isPending} onRefresh={onRefresh} />}
			renderItem={renderItem}
			onEndReached={onEndReached}
		/>
	)
}
