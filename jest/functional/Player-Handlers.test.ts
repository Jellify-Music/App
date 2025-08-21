import { Progress } from 'react-native-track-player'
import { shouldMarkPlaybackFinished } from '../../src/providers/Player/utils/handlers'

describe('Playback Event Handlers', () => {
	it('should determine that the track has finished', () => {
		const progress: Progress = {
			position: 95.23423453,
			duration: 98.23557854,
			buffered: 98.2345568679345,
		}

		const playbackFinished = shouldMarkPlaybackFinished(progress)

		expect(playbackFinished).toBeTruthy()
	})

	it('should determine the track is still playing', () => {
		const progress: Progress = {
			position: 85.23423453,
			duration: 98.23557854,
			buffered: 98.2345568679345,
		}

		const playbackFinished = shouldMarkPlaybackFinished(progress)

		expect(playbackFinished).toBeFalsy()
	})
})
