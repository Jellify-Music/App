import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'

enum AlbumQueryKeys {
	AlbumById,
	AlbumDiscs,
}

export const AlbumQueryKey = (album: BaseItemDto) => [AlbumQueryKeys.AlbumById, album.Id]

export const AlbumDiscsQueryKey = (album: BaseItemDto) => [AlbumQueryKeys.AlbumDiscs, album.Id]
