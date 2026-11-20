import type { DownloadedTrack } from 'react-native-nitro-player'
import { countDownloadedByAlbum, isAlbumDownloaded } from '../../src/utils/downloaded-albums'

const download = (trackId: string, item: object | string | undefined): DownloadedTrack =>
	({
		trackId,
		originalTrack: {
			id: trackId,
			extraPayload: item === undefined ? {} : { item: JSON.stringify(item) },
		},
	}) as unknown as DownloadedTrack

describe('countDownloadedByAlbum', () => {
	it('counts the downloaded tracks of each album', () => {
		expect(
			countDownloadedByAlbum([
				download('1', { Id: '1', AlbumId: 'a' }),
				download('2', { Id: '2', AlbumId: 'a', Name: 'Two' }),
				download('3', { Id: '3', AlbumId: 'b' }),
			]),
		).toEqual({ a: 2, b: 1 })
	})

	it('leaves out tracks that do not say what album they are on', () => {
		expect(
			countDownloadedByAlbum([
				download('1', { Id: '1' }),
				download('2', undefined),
				download('3', { Id: '3', AlbumId: 'a' }),
			]),
		).toEqual({ a: 1 })
	})

	it('copes with a downloaded track that is missing its details', () => {
		expect(countDownloadedByAlbum([{ trackId: 'x' } as unknown as DownloadedTrack])).toEqual({})
	})

	it('has nothing for nothing', () => {
		expect(countDownloadedByAlbum([])).toEqual({})
	})
})

describe('isAlbumDownloaded', () => {
	it('is true once as many tracks are downloaded as the album has', () => {
		expect(isAlbumDownloaded(12, 12)).toBe(true)
		expect(isAlbumDownloaded(13, 12)).toBe(true)
	})

	it('is false for some of it, or none', () => {
		expect(isAlbumDownloaded(11, 12)).toBe(false)
		expect(isAlbumDownloaded(undefined, 12)).toBe(false)
	})

	it('is false when it is not known how many tracks the album has', () => {
		expect(isAlbumDownloaded(5, undefined)).toBe(false)
		expect(isAlbumDownloaded(5, null)).toBe(false)
		expect(isAlbumDownloaded(0, 0)).toBe(false)
	})
})
