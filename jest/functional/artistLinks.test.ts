import {
	fetchMusicBrainzLinks,
	isMusicBrainzId,
	musicBrainzArtistUrl,
	parseMusicBrainzLinks,
} from '../../src/api/queries/artist-info/links'
import { CHVRCHES, IGORRR, OF_MICE_AND_MEN, relation } from '../helpers/musicbrainz-relations'

const MBID = '82b6784e-8161-42a0-9b5c-b9d31e63fd85'

describe('isMusicBrainzId', () => {
	it('accepts a UUID, and nothing else', () => {
		expect(isMusicBrainzId(MBID)).toBe(true)
		expect(isMusicBrainzId(MBID.toUpperCase())).toBe(true)
		expect(isMusicBrainzId('')).toBe(false)
		expect(isMusicBrainzId(undefined)).toBe(false)
		expect(isMusicBrainzId(`${MBID}/../x`)).toBe(false)
		expect(isMusicBrainzId('../../evil')).toBe(false)
	})
})

describe('musicBrainzArtistUrl', () => {
	it("is the artist's page on MusicBrainz", () => {
		expect(musicBrainzArtistUrl(MBID)).toBe(`https://musicbrainz.org/artist/${MBID}`)
	})
})

describe('parseMusicBrainzLinks', () => {
	it('finds Wikipedia through Wikidata, YouTube and Bandsintown, in that order', () => {
		expect(parseMusicBrainzLinks(OF_MICE_AND_MEN)).toEqual([
			{
				kind: 'wikipedia',
				url: 'https://www.wikidata.org/wiki/Special:GoToLinkedPage/enwiki/Q2635412',
			},
			{ kind: 'youtube', url: 'https://www.youtube.com/user/OMandMTV' },
			{ kind: 'bandsintown', url: 'https://www.bandsintown.com/a/300105' },
		])

		expect(parseMusicBrainzLinks(CHVRCHES)).toEqual([
			{
				kind: 'wikipedia',
				url: 'https://www.wikidata.org/wiki/Special:GoToLinkedPage/enwiki/Q5118436',
			},
			{
				kind: 'youtube',
				url: 'https://www.youtube.com/channel/UCXCfOEJFMa40s-57zxw9MYw',
			},
			{ kind: 'bandsintown', url: 'https://www.bandsintown.com/a/4888013' },
		])

		expect(parseMusicBrainzLinks(IGORRR).map((link) => link.kind)).toEqual([
			'wikipedia',
			'youtube',
			'bandsintown',
		])
	})

	it('prefers a direct Wikipedia link when there is one', () => {
		const links = parseMusicBrainzLinks([
			relation('wikidata', 'https://www.wikidata.org/wiki/Q1'),
			relation('wikipedia', 'https://en.wikipedia.org/wiki/Wardruna'),
		])

		expect(links).toEqual([
			{ kind: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Wardruna' },
		])
	})

	it('does not take YouTube Music for YouTube', () => {
		expect(
			parseMusicBrainzLinks([
				relation('youtube music', 'https://music.youtube.com/channel/UCx'),
			]),
		).toEqual([])
	})

	it('has nothing for an artist MusicBrainz has no such links for', () => {
		expect(parseMusicBrainzLinks([])).toEqual([])
		expect(
			parseMusicBrainzLinks([relation('official homepage', 'https://example.com/')]),
		).toEqual([])
	})

	it('leaves out relationships that have ended', () => {
		expect(
			parseMusicBrainzLinks([relation('youtube', 'https://www.youtube.com/c/Old', true)]),
		).toEqual([])
	})

	it('only takes https links to the right site', () => {
		expect(
			parseMusicBrainzLinks([
				relation('youtube', 'http://www.youtube.com/user/x'),
				relation('bandsintown', 'https://www.bandsintown.com.evil.example/a/1'),
				relation('wikidata', 'https://www.wikidata.org/wiki/Q1/../../x'),
				relation('youtube', 'javascript:alert(1)'),
			]),
		).toEqual([])

		expect(
			parseMusicBrainzLinks([relation('youtube', 'https://youtu.be/abc')]).map((l) => l.url),
		).toEqual(['https://youtu.be/abc'])
	})

	it('skips relationships with no link', () => {
		expect(
			parseMusicBrainzLinks([{ type: 'youtube' }, { type: 'bandsintown', url: {} }]),
		).toEqual([])
	})
})

describe('fetchMusicBrainzLinks', () => {
	const mockFetch = jest.fn()

	beforeEach(() => {
		mockFetch.mockReset()
		global.fetch = mockFetch as unknown as typeof fetch
	})

	it('asks MusicBrainz for the url relationships, saying who is asking, and parses them', async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({ relations: OF_MICE_AND_MEN }),
		})

		const links = await fetchMusicBrainzLinks(MBID)

		expect(links.map((link) => link.kind)).toEqual(['wikipedia', 'youtube', 'bandsintown'])

		const [url, init] = mockFetch.mock.calls[0]
		expect(url).toBe(`https://musicbrainz.org/ws/2/artist/${MBID}?inc=url-rels&fmt=json`)
		expect(init.headers['User-Agent']).toMatch(/^Jellify\/\d+\.\d+\.\d+ \(https:\/\//)
	})

	it('has no links when the answer has no relationships', async () => {
		mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })

		expect(await fetchMusicBrainzLinks(MBID)).toEqual([])
	})

	it('fails on an error from MusicBrainz, such as being rate limited', async () => {
		mockFetch.mockResolvedValue({ ok: false, status: 503 })

		await expect(fetchMusicBrainzLinks(MBID)).rejects.toThrow('503')
	})

	it('does not ask at all for something that is not a MusicBrainz ID', async () => {
		expect(await fetchMusicBrainzLinks('../../evil')).toEqual([])
		expect(mockFetch).not.toHaveBeenCalled()
	})
})
