import { SortableBaseItemDto } from '@/src/components/Playlist/interfaces'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { InfiniteData } from '@tanstack/react-query'

export function selectPlaylistTracks(
	data: InfiniteData<BaseItemDto[], number>,
): SortableBaseItemDto[] {
	return data.pages.flatMap((page) => page.map(sortifyBaseItemDto))
}

function sortifyBaseItemDto({ Id, ...rest }: BaseItemDto): SortableBaseItemDto {
	return {
		id: Id!,
		...rest,
	}
}
