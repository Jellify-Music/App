export function formatArtistName(artistName: string | null | undefined): string {
	if (!artistName) return 'Unknown Artist'
	return artistName
}

export function formatArtistNames(artistNames: string[]): string {
	return artistNames.map(formatArtistName).join(' • ')
}
