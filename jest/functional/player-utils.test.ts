import isPlaybackFinished from '../../src/api/mutations/playback/utils'
import { Progress } from 'react-native-track-player'

describe('Playback Event Handlers', () => {
	it('should determine that the track has finished', () => {
		const progress: Progress = {
			position: 95.23423453,
			duration: 98.23557854,
			buffered: 98.2345568679345,
		}

		const { position, duration } = progress

		const playbackFinished = isPlaybackFinished(position, duration)

		expect(playbackFinished).toBeTruthy()
	})

	it('should determine the track is still playing', () => {
		const progress: Progress = {
			position: 45.23423453,
			duration: 98.23557854,
			buffered: 98.2345568679345,
		}

		const { position, duration } = progress

		const playbackFinished = isPlaybackFinished(position, duration)

		expect(playbackFinished).toBeFalsy()
	})
})
