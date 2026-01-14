import { QuickAction, SwipeAction } from '../components/SwipeableRow'
import { SwipeActionType } from '../../../stores/settings/swipe'

export type SwipeHandlers = {
	addToQueue: () => void
	toggleFavorite: () => void
	addToPlaylist: () => void
}

export type SwipeConfig = {
	leftAction?: SwipeAction
	leftActions?: QuickAction[]
	rightAction?: SwipeAction
	rightActions?: QuickAction[]
}
function toSwipeAction(type: SwipeActionType, handlers: SwipeHandlers): SwipeAction {
	switch (type) {
		case 'AddToQueue':
			return {
				label: 'Add to queue',
				// Use a distinct icon from Add to Playlist to avoid confusion
				icon: 'playlist-play',
				color: '$success',
				onTrigger: handlers.addToQueue,
			}
		case 'ToggleFavorite':
			return {
				label: 'Toggle favorite',
				icon: 'heart',
				color: '$primary',
				onTrigger: handlers.toggleFavorite,
			}
		case 'AddToPlaylist':
		default:
			return {
				label: 'Add to playlist',
				icon: 'playlist-plus',
				color: '$color',
				onTrigger: handlers.addToPlaylist,
			}
	}
}

function toQuickAction(type: SwipeActionType, handlers: SwipeHandlers): QuickAction {
	switch (type) {
		case 'AddToQueue':
			return {
				// Distinct icon for Add to Queue quick action
				icon: 'playlist-play',
				color: '$success',
				onPress: handlers.addToQueue,
			}
		case 'ToggleFavorite':
			return {
				icon: 'heart',
				color: '$primary',
				onPress: handlers.toggleFavorite,
			}
		case 'AddToPlaylist':
		default:
			return {
				icon: 'playlist-plus',
				color: '$color',
				onPress: handlers.addToPlaylist,
			}
	}
}

export function buildSwipeConfig(params: {
	left: SwipeActionType[]
	right: SwipeActionType[]
	handlers: SwipeHandlers
}): SwipeConfig {
	const { left, right, handlers } = params

	const cfg: SwipeConfig = {}

	if (left && left.length > 0) {
		if (left.length === 1) cfg.leftAction = toSwipeAction(left[0], handlers)
		else cfg.leftActions = left.map((t) => toQuickAction(t, handlers))
	}

	if (right && right.length > 0) {
		if (right.length === 1) cfg.rightAction = toSwipeAction(right[0], handlers)
		else cfg.rightActions = right.map((t) => toQuickAction(t, handlers))
	}

	return cfg
}
