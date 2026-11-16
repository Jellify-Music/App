import { NameGuidPair } from '@jellyfin/sdk/lib/generated-client'
import i18n from '../../i18n'

export function formatArtistName(
	artistName: string | null | undefined,
	releaseDate?: string | null | undefined,
): string {
	const unknownArtist = i18n.t('placeholders.unknownArtist')
	if (!artistName) return releaseDate ? `${releaseDate} • ${unknownArtist}` : unknownArtist
	return releaseDate ? `${releaseDate} • ${artistName}` : artistName
}

export function formatArtistItemsNames(
	artistItems: NameGuidPair[] | null | undefined,
	releaseDate?: string | null | undefined,
): string {
	const unknownArtist = i18n.t('placeholders.unknownArtist')
	if (!artistItems || artistItems.length === 0)
		return releaseDate ? `${releaseDate} • ${unknownArtist}` : unknownArtist
	return releaseDate
		? `${releaseDate} • ${artistItems.map((item) => item.Name).join(' • ')}`
		: artistItems.map((item) => item.Name).join(' • ')
}

export function formatArtistNames(artistNames: string[] | null | undefined): string {
	if (!artistNames || artistNames.length === 0) return i18n.t('placeholders.unknownArtist')
	return artistNames.map((artistName) => formatArtistName(artistName)).join(' • ')
}
