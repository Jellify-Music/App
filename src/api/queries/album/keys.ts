import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'

enum AlbumQueryKeys {
	AlbumDiscs,
}

export const AlbumDiscsQueryKey = (album: BaseItemDto) => [AlbumQueryKeys.AlbumDiscs, album.Id]
