const mockAdd = jest.fn().mockResolvedValue(undefined)
const mockSetQueue = jest.fn().mockResolvedValue(undefined)

jest.mock('react-native-track-player', () => ({
	__esModule: true,
	default: {
		add: mockAdd,
		setQueue: mockSetQueue,
		remove: jest.fn(),
		move: jest.fn(),
		reset: jest.fn(),
		getQueue: jest.fn(),
		getActiveTrack: jest.fn(),
		getActiveTrackIndex: jest.fn(),
		skip: jest.fn(),
		removeUpcomingTracks: jest.fn(),
		play: jest.fn(),
		pause: jest.fn(),
		getPlaybackState: jest.fn(),
		updateOptions: jest.fn(),
	},
	Capability: {},
	Event: {},
	Progress: {} as never,
	RatingType: {},
	RepeatMode: {},
	State: {},
	Track: {} as never,
	TrackType: {} as never,
	useTrackPlayerEvents: jest.fn(),
}))

type GlobalWithDev = typeof globalThis & { __DEV__?: boolean }
const globalWithDev = globalThis as GlobalWithDev

describe('PlayerNative wrapper', () => {
	const loadModule = () => require('../../src/providers/Player/native').default

	let consoleWarnSpy: jest.SpyInstance

	beforeEach(() => {
		mockAdd.mockClear()
		mockSetQueue.mockClear()
		jest.resetModules()
		globalWithDev.__DEV__ = true
		consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
	})

	afterEach(() => {
		delete globalWithDev.__DEV__
		consoleWarnSpy.mockRestore()
	})

	it('sanitizes tracks before delegating to TrackPlayer.add', async () => {
		const TrackPlayer = loadModule()

		const fatTrack = {
			id: 'id-1',
			url: 'https://example.com/track.mp3',
			title: 'Title',
			sourceType: 'stream',
			item: { Id: 'item-1' },
		}

		await TrackPlayer.add(fatTrack)

		expect(mockAdd).toHaveBeenCalledTimes(1)
		const [passedTracks] = mockAdd.mock.calls[0]
		expect(passedTracks).toEqual([
			{
				id: 'id-1',
				title: 'Title',
				url: 'https://example.com/track.mp3',
			},
		])
		expect(passedTracks[0]).not.toHaveProperty('sourceType')
		expect(passedTracks[0]).not.toHaveProperty('item')
		expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
		expect(String(consoleWarnSpy.mock.calls[0][0])).toContain('non-RNTP fields')
	})

	it('passes insertBeforeIndex through to TrackPlayer.add', async () => {
		const TrackPlayer = loadModule()

		await TrackPlayer.add({ url: 'file:///track.mp3' }, 3)

		expect(mockAdd).toHaveBeenCalledWith([{ url: 'file:///track.mp3' }], 3)
	})

	it('sanitizes arrays passed to setQueue and preserves headers', async () => {
		const TrackPlayer = loadModule()

		const headers = { Authorization: 'Bearer token' }
		await TrackPlayer.setQueue([
			{
				id: 'id-1',
				url: 'https://example.com/a.mp3',
				artist: 'Artist',
				item: { Id: 'item-1' },
			},
			{
				url: 'https://example.com/b.mp3',
				headers,
				item: { Id: 'item-2' },
			},
		])

		expect(mockSetQueue).toHaveBeenCalledTimes(1)
		const [queue] = mockSetQueue.mock.calls[0]
		expect(queue).toEqual([
			{
				artist: 'Artist',
				id: 'id-1',
				url: 'https://example.com/a.mp3',
			},
			{
				headers,
				url: 'https://example.com/b.mp3',
			},
		])
	})

	it('warns only once per extra-key signature', async () => {
		const TrackPlayer = loadModule()

		const fatTrack = {
			url: 'https://example.com/track.mp3',
			item: { Id: 'id-1' },
		}

		await TrackPlayer.add(fatTrack)
		await TrackPlayer.add(fatTrack)

		expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
	})
})
