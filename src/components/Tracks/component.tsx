import React, { RefObject, useRef } from 'react'
import Track from '../Global/components/Track'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { Queue } from '../../services/types/queue-item'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { LibrarySectionListData, LibrarySectionListRenderItemInfo } from '../Global/types'
import { SectionListRef } from '@legendapp/list/section-list'
import ItemList from '../Global/components/item-list'
import ItemSectionList from '../Global/components/item-section-list'

interface TracksProps {
	tracksInfiniteQuery: UseInfiniteQueryResult<(BaseItemDto | LibrarySectionListData)[], Error>
	trackPageParams?: RefObject<Set<string>>
	showAlphabeticalSelector?: boolean
	sortBy?: ItemSortBy
	sortDescending?: boolean
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
	queue,
}: Omit<TracksProps, 'sortBy'>) {
	const sectionListRef = useRef<SectionListRef>(null)

	const tracks =
		(
			tracksInfiniteQuery as UseInfiniteQueryResult<LibrarySectionListData[], Error>
		).data?.flatMap((section) => section.data) ?? []

	const renderItem = ({ item: track, index }: LibrarySectionListRenderItemInfo) => (
		<Track
			showArtwork
			index={0}
			track={track}
			testID={`track-item-${index}`}
			tracklist={tracks.slice(tracks.indexOf(track), tracks.indexOf(track) + 50)}
			queue={queue}
		/>
	)

	return (
		<ItemSectionList
			ref={sectionListRef}
			query={tracksInfiniteQuery as UseInfiniteQueryResult<LibrarySectionListData[], Error>}
			renderItem={renderItem}
			sortDescending={sortDescending}
		/>
	)
}
