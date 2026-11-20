import { version } from '../../../../package.json'
import { SOURCE_CODE_URL } from '../../../configs/privacy.config'

/** Where an artist can be found elsewhere on the web */
export type ArtistLinkKind = 'musicbrainz' | 'wikipedia' | 'youtube' | 'bandsintown'

export interface ArtistLink {
	kind: ArtistLinkKind
	url: string
}

/** The part of a MusicBrainz relationship that matters here */
export interface MusicBrainzRelation {
	type: string
	ended?: boolean
	url?: { resource?: string }
}

const MUSICBRAINZ_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const WIKIDATA_ENTITY = /^https:\/\/(?:www\.)?wikidata\.org\/wiki\/(Q\d+)$/i

/** Whether this is an https URL on the host or one of its subdomains */
const isHttpsOn = (url: string, ...hosts: string[]): boolean => {
	const host = /^https:\/\/([^/?#:@]+)(?:[/?#:]|$)/i.exec(url)?.[1]?.toLowerCase()

	return host !== undefined && hosts.some((h) => host === h || host.endsWith(`.${h}`))
}

export const isMusicBrainzId = (id: string | null | undefined): id is string =>
	Boolean(id && MUSICBRAINZ_ID.test(id))

export const musicBrainzArtistUrl = (musicBrainzId: string): string =>
	`https://musicbrainz.org/artist/${musicBrainzId}`

/**
 * Wikipedia is not something MusicBrainz links to directly any more, only Wikidata. Wikidata sends
 * whoever follows this on to the entity's English Wikipedia article.
 */
const wikipediaFromWikidata = (wikidataUrl: string): string | undefined => {
	const entity = WIKIDATA_ENTITY.exec(wikidataUrl)?.[1]

	return entity
		? `https://www.wikidata.org/wiki/Special:GoToLinkedPage/enwiki/${entity}`
		: undefined
}

/**
 * Picks the Wikipedia, YouTube and Bandsintown links from an artist's MusicBrainz relationships,
 * in that order. Relationships that have ended, and anything that is not an https link to the
 * right site, are left out.
 */
export function parseMusicBrainzLinks(relations: MusicBrainzRelation[]): ArtistLink[] {
	const current = relations.filter((relation) => !relation.ended && relation.url?.resource)

	const urlsOfType = (type: string, ...hosts: string[]) =>
		current
			.filter((relation) => relation.type === type)
			.map((relation) => relation.url!.resource!)
			.filter((url) => isHttpsOn(url, ...hosts))

	const wikipedia =
		urlsOfType('wikipedia', 'wikipedia.org')[0] ??
		urlsOfType('wikidata', 'wikidata.org').map(wikipediaFromWikidata).find(Boolean)

	// "youtube music" is a relationship of its own: this is the artist's channel on YouTube
	const youtube = urlsOfType('youtube', 'youtube.com', 'youtu.be')[0]

	const bandsintown = urlsOfType('bandsintown', 'bandsintown.com')[0]

	const found: { kind: ArtistLinkKind; url: string | undefined }[] = [
		{ kind: 'wikipedia', url: wikipedia },
		{ kind: 'youtube', url: youtube },
		{ kind: 'bandsintown', url: bandsintown },
	]

	return found.flatMap(({ kind, url }) => (url ? [{ kind, url }] : []))
}

/**
 * The links MusicBrainz has for an artist. MusicBrainz asks that clients say who they are, and
 * only the artist's MusicBrainz ID is sent.
 */
export async function fetchMusicBrainzLinks(
	musicBrainzId: string,
	signal?: AbortSignal,
): Promise<ArtistLink[]> {
	// the ID comes from the server, so it is checked before it goes into a URL
	if (!isMusicBrainzId(musicBrainzId)) return []

	const response = await fetch(
		`https://musicbrainz.org/ws/2/artist/${musicBrainzId}?inc=url-rels&fmt=json`,
		{
			signal,
			headers: {
				Accept: 'application/json',
				'User-Agent': `Jellify/${version} (${SOURCE_CODE_URL})`,
			},
		},
	)

	if (!response.ok) throw new Error(`MusicBrainz answered ${response.status}`)

	const body: { relations?: MusicBrainzRelation[] } = await response.json()

	return parseMusicBrainzLinks(body.relations ?? [])
}
