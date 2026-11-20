import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { fetchAlbumsTracks } from '../../src/api/queries/artist/utils/download-tracks'
import { fetchAlbumDiscs } from '../../src/api/queries/item'

jest.mock('../../src/api/queries/item', () => ({ fetchAlbumDiscs: jest.fn() }))

const track = (Id: string): BaseItemDto => ({ Id, Name: Id })

const mockDiscs = (byAlbum: Record<string, BaseItemDto[][]>) =>
	(fetchAlbumDiscs as jest.Mock).mockImplementation(async (_api, album: BaseItemDto) =>
		(byAlbum[album.Id!] ?? []).map((data, i) => ({ title: String(i + 1), data })),
	)

describe('fetchAlbumsTracks', () => {
	beforeEach(() => jest.clearAllMocks())

	it('lists the tracks of every album, in the albums order and the discs order', async () => {
		mockDiscs({
			a: [[track('a1'), track('a2')], [track('a3')]],
			b: [[track('b1')]],
		})

		const tracks = await fetchAlbumsTracks(undefined, [{ Id: 'a' }, { Id: 'b' }])

		expect(tracks.map((t) => t.Id)).toEqual(['a1', 'a2', 'a3', 'b1'])
	})

	it('lists a track once when albums overlap, or when it is listed under several discs', async () => {
		mockDiscs({
			a: [[track('x'), track('y')], [track('y')]],
			b: [[track('x'), track('z')]],
		})

		const tracks = await fetchAlbumsTracks(undefined, [{ Id: 'a' }, { Id: 'b' }])

		expect(tracks.map((t) => t.Id)).toEqual(['x', 'y', 'z'])
	})

	it('has nothing for no albums, and skips anything without an id', async () => {
		expect(await fetchAlbumsTracks(undefined, [])).toEqual([])

		mockDiscs({ a: [[{ Name: 'no id' }, track('ok')]] })

		expect((await fetchAlbumsTracks(undefined, [{ Id: 'a' }])).map((t) => t.Id)).toEqual(['ok'])
	})

	it('passes the abort signal on to every album request', async () => {
		mockDiscs({ a: [[track('1')]], b: [[track('2')]] })
		const { signal } = new AbortController()

		await fetchAlbumsTracks(undefined, [{ Id: 'a' }, { Id: 'b' }], signal)

		expect((fetchAlbumDiscs as jest.Mock).mock.calls.map((call) => call[2])).toEqual([
			signal,
			signal,
		])
	})
})
