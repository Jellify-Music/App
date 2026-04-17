/**
 *
 * @param genres A list of Genres returned by the Jellyfin API
 * @returns A the first, singular genre the array
 * @example Kim Petras - "Dance"
 */
export function pickFirstGenre(genres: string[] | undefined | null): string {
	if (!genres || genres.length === 0) {
		return ''
	}

	return genres[0].split(';')[0]
}
