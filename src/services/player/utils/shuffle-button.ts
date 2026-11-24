import { NotificationButtonEvent, TrackPlayer } from 'react-native-nitro-player'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import { handleDeshuffle, handleShuffle } from '../../../player/controls/shuffle'

export const SHUFFLE_BUTTON_ID = 'shuffle'

function setShuffleButtonState(shuffled: boolean) {
	TrackPlayer.setNotificationButtonState({ buttonId: SHUFFLE_BUTTON_ID, isActive: shuffled })
}

/**
 * Keeps the shuffle button in the media controls in step with the queue,
 * however the queue was shuffled or replaced.
 */
export function syncShuffleButton() {
	setShuffleButtonState(usePlayerQueueStore.getState().shuffled)

	usePlayerQueueStore.subscribe(({ shuffled }, prev) => {
		if (shuffled !== prev.shuffled) setShuffleButtonState(shuffled)
	})
}

/**
 * Shuffles or restores the queue from the media controls.
 *
 * The button has already switched state by the time this is called, so it is
 * switched back if the queue couldn't be updated.
 */
export async function onShuffleButtonPress({ isActive }: NotificationButtonEvent) {
	const { shuffled } = usePlayerQueueStore.getState()

	if (isActive === undefined || isActive === shuffled) return

	usePlayerQueueStore.setState({ shuffled: isActive })

	const result = isActive ? await handleShuffle() : await handleDeshuffle()

	if (!result) {
		usePlayerQueueStore.setState({ shuffled })
		setShuffleButtonState(shuffled)
	}
}
