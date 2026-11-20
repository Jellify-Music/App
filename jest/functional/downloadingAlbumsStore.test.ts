import useDownloadingAlbumsStore from '../../src/stores/downloading-albums'

describe('the progress of the albums that are downloading', () => {
	beforeEach(() => useDownloadingAlbumsStore.setState({ progress: {} }))

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
})
