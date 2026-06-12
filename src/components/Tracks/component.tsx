import React, { useRef } from 'react'
import Track from '../Global/components/Track'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { Queue } from '../../services/types/queue-item'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../../screens/types'
import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { LibrarySectionListData, LibrarySectionListRenderItemInfo } from '../Global/types'
import { SectionListRef } from '@legendapp/list/section-list'
import { useNavigation } from '@react-navigation/native'
import ItemList from '../Global/components/item-list'
import ItemSectionList from '../Global/components/item-section-list'
import { JumpToLetter } from '../../api/queries/letter-jump'

/**
 * The number of upcoming tracks loaded into the player queue when a track is
 * pressed
 */
const QUEUE_SLICE_SIZE = 50

interface TracksProps {
	tracksInfiniteQuery: UseInfiniteQueryResult<(BaseItemDto | LibrarySectionListData)[], Error>
	showAlphabeticalSelector?: boolean
	sortBy?: ItemSortBy
	sortDescending?: boolean
	onJumpToLetter?: JumpToLetter
	queue: Queue
}

export default function Tracks(props: TracksProps): React.JSX.Element {
	return props.showAlphabeticalSelector ? (
		<TracksSectionList {...props} />
	) : (
		<TracksList {...props} />
	)
}

function TracksList({ tracksInfiniteQuery }: TracksProps) {
	return <ItemList query={tracksInfiniteQuery as UseInfiniteQueryResult<BaseItemDto[], Error>} />
}

function TracksSectionList({
	tracksInfiniteQuery,
	sortDescending,
	onJumpToLetter,
	queue,
}: Omit<TracksProps, 'sortBy'>) {
	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()

	const sectionListRef = useRef<SectionListRef>(null)

	const sections =
		(tracksInfiniteQuery as UseInfiniteQueryResult<LibrarySectionListData[], Error>).data ?? []

	// Single pass over the sections: a flat tracklist plus a track-id → flat
	// index map, so renderItem builds its queue slice in O(1) instead of
	// scanning the whole list per row. React Compiler memoizes this on the
	// sections' identity.
	const tracks: BaseItemDto[] = []
	const flatIndexById = new Map<string, number>()
	for (const section of sections) {
		for (const item of section.data) {
			if (item.Id) flatIndexById.set(item.Id, tracks.length)
			tracks.push(item)
		}
	}

	const renderItem = ({ item: track, index }: LibrarySectionListRenderItemInfo) => {
		const flatIndex = track.Id ? (flatIndexById.get(track.Id) ?? 0) : 0

		return (
			<Track
				navigation={navigation}
				showArtwork
				index={0}
				track={track}
				testID={`track-item-${index}`}
				tracklist={tracks.slice(flatIndex, flatIndex + QUEUE_SLICE_SIZE)}
				queue={queue}
			/>
		)
	}

	return (
		<ItemSectionList
			ref={sectionListRef}
			query={tracksInfiniteQuery as UseInfiniteQueryResult<LibrarySectionListData[], Error>}
			renderItem={renderItem}
			sortDescending={sortDescending}
			onJumpToLetter={onJumpToLetter}
		/>
	)
}
