import type { MusicBrainzRelation } from '../../src/api/queries/artist-info/links'

const relation = (type: string, resource: string, ended = false): MusicBrainzRelation => ({
	type,
	ended,
	url: { resource },
})

// Trimmed from MusicBrainz's answers for ?inc=url-rels, with other relationships kept as noise

/** Of Mice & Men: no `wikipedia` relationship, only Wikidata, as is usual now */
export const OF_MICE_AND_MEN: MusicBrainzRelation[] = [
	relation('allmusic', 'https://www.allmusic.com/artist/mn0001162262'),
	relation('bandsintown', 'https://www.bandsintown.com/a/300105'),
	relation('official homepage', 'https://www.ofmiceandmen.com/'),
	relation('social network', 'https://twitter.com/OMandM'),
	relation('wikidata', 'https://www.wikidata.org/wiki/Q2635412'),
	relation('youtube', 'https://www.youtube.com/user/OMandMTV'),
	relation('youtube music', 'https://music.youtube.com/channel/UCrh0I8I0l6eAj2DuW0GE_Fg'),
]

/** Igorrr */
export const IGORRR: MusicBrainzRelation[] = [
	relation('bandcamp', 'https://igorrr.bandcamp.com/'),
	relation('bandsintown', 'https://www.bandsintown.com/a/410439'),
	relation('discogs', 'https://www.discogs.com/artist/1124492'),
	relation('wikidata', 'https://www.wikidata.org/wiki/Q2486120'),
	relation('youtube', 'https://www.youtube.com/channel/UC_3P0PpZrIhXLtV8kwsaC9Q'),
	relation('youtube music', 'https://music.youtube.com/channel/UC7gJRij98IY_nFfFDrld8yQ'),
]

/** CHVRCHES */
export const CHVRCHES: MusicBrainzRelation[] = [
	relation('bandsintown', 'https://www.bandsintown.com/a/4888013'),
	relation('official homepage', 'https://chvrch.es/'),
	relation('wikidata', 'https://www.wikidata.org/wiki/Q5118436'),
	relation('youtube', 'https://www.youtube.com/channel/UCXCfOEJFMa40s-57zxw9MYw'),
	relation('youtube music', 'https://music.youtube.com/channel/UCvInFYiyeAJOGEjhqJnyaMA'),
]

export { relation }
