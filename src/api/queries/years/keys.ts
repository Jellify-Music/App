import { MusicLibraryQueryKey } from '../libraries/keys'

export const LibraryYearsQueryKey = (libraryId: string | undefined, userId: string | undefined) => [
	'LibraryYears',
	MusicLibraryQueryKey(libraryId),
	userId,
]
