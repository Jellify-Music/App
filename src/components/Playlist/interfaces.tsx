import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'

export interface PlaylistProps {
	playlist: BaseItemDto
	canEdit?: boolean | undefined
}

export interface PlaylistOrderMutation {
	playlist: BaseItemDto
	track: BaseItemDto
	to: number
}

export interface RemoveFromPlaylistMutation {
	playlist: BaseItemDto
	track: BaseItemDto
	index: number
}
