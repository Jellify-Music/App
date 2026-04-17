import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'

export interface AddToPlaylistMutation {
	tracks: BaseItemDto[]
	playlist: BaseItemDto
}
