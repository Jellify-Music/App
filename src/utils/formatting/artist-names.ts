export function formatArtistName(
	artistName: string | null | undefined,
	releaseDate?: string | null | undefined,
): string {
	const unknownArtist = 'Unknown Artist'
	if (!artistName) return releaseDate ? `${releaseDate} • ${unknownArtist}` : unknownArtist
	return releaseDate ? `${releaseDate} • ${artistName}` : artistName
}

export function formatArtistNames(artistNames: string[] | null | undefined): string {
	if (!artistNames || artistNames.length === 0) return 'Unknown Artist'
	return artistNames.map((artistName) => formatArtistName(artistName)).join(' • ')
}
