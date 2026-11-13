import { MusicLibraryQueryKey } from '../libraries/keys'

export const GenresQueryKey = (libraryId: string | undefined, userId: string | undefined) => [
	'Genres',
	MusicLibraryQueryKey(libraryId),
	userId,
]
