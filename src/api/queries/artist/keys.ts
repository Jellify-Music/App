import { QueryKeys } from '../../../enums/query-keys'

export const ArtistQueryKey = (artistId: string | undefined | null) => [
	QueryKeys.ArtistById,
	artistId,
]
