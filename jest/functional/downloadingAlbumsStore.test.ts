import useDownloadingAlbumsStore from '../../src/stores/downloading-albums'

describe('the progress of the albums that are downloading', () => {
	beforeEach(() => useDownloadingAlbumsStore.setState({ progress: {}, downloaded: {} }))

	it('holds how far along each album is', () => {
		useDownloadingAlbumsStore.getState().set({ a: 0.25, b: 0.5 })

		expect(useDownloadingAlbumsStore.getState().progress).toEqual({ a: 0.25, b: 0.5 })
	})

	it('drops an album once it is no longer downloading', () => {
		const { set } = useDownloadingAlbumsStore.getState()

		set({ a: 0.25, b: 0.5 })
		set({ b: 0.75 })

		expect(useDownloadingAlbumsStore.getState().progress).toEqual({ b: 0.75 })
	})

	it('keeps what it has when nothing changed, so rows are not drawn again for nothing', () => {
		const { set } = useDownloadingAlbumsStore.getState()

		set({ a: 0.25 })
		const before = useDownloadingAlbumsStore.getState().progress

		set({ a: 0.25 })

		expect(useDownloadingAlbumsStore.getState().progress).toBe(before)
	})

	it('holds how many tracks of each album are downloaded, and keeps what it has when nothing changed', () => {
		const { setDownloaded } = useDownloadingAlbumsStore.getState()

		setDownloaded({ a: 12, b: 3 })
		const before = useDownloadingAlbumsStore.getState().downloaded

		setDownloaded({ a: 12, b: 3 })
		expect(useDownloadingAlbumsStore.getState().downloaded).toBe(before)

		setDownloaded({ a: 12, b: 4 })
		expect(useDownloadingAlbumsStore.getState().downloaded).toEqual({ a: 12, b: 4 })
	})

	it('keeps progress and downloaded counts apart', () => {
		useDownloadingAlbumsStore.getState().set({ a: 0.5 })
		useDownloadingAlbumsStore.getState().setDownloaded({ a: 3 })

		expect(useDownloadingAlbumsStore.getState().progress).toEqual({ a: 0.5 })
		expect(useDownloadingAlbumsStore.getState().downloaded).toEqual({ a: 3 })
	})
})
