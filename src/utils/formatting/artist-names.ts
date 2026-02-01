export function formatArtistName(artistName: string | null | undefined): string {
	if (!artistName) return 'Unknown Artist'
	return artistName
}

export function formatArtistNames(artistNames: string[] | null | undefined): string {
	if (!artistNames || artistNames.length === 0) return 'Unknown Artist'
	return artistNames.map(formatArtistName).join(' • ')
}
