import isPlaybackFinished from '../../../src/api/mutations/playback/utils'

describe('Playback Event Handlers', () => {
	it('should determine that the track has finished', () => {
		const position = 95.23423453
		const duration = 98.23557854

		const playbackFinished = isPlaybackFinished(position, duration)

		expect(playbackFinished).toBeTruthy()
	})

	it('should determine the track is still playing', () => {
		const position = 45.23423453
		const duration = 98.23557854

		const playbackFinished = isPlaybackFinished(position, duration)

		expect(playbackFinished).toBeFalsy()
	})
})
