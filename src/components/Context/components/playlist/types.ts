import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'

export interface AddToPlaylistRowProps {
	tracks: BaseItemDto[]
	source?: BaseItemDto
}

export interface DeletePlaylistRowProps {
	playlist: BaseItemDto
}

export interface RemoveFromPlaylistRowProps {
	track: BaseItemDto
	playlist: BaseItemDto
}
