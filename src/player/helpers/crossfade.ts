/**
 * Crossfade utilities for smooth transitions between tracks
 */

export type FadeCurve = 'linear' | 'logarithmic' | 'exponential'

/**
 * Calculate fade value based on progress and curve type
 * @param progress - Value from 0 to 1 representing fade progress
 * @param curve - Type of fade curve to apply
 * @returns Fade value from 0 to 1
 */
export const calculateFadeValue = (progress: number, curve: FadeCurve): number => {
	// Clamp progress to valid range
	const clampedProgress = Math.max(0, Math.min(1, progress))

	switch (curve) {
		case 'linear':
			return clampedProgress

		case 'logarithmic':
			// Logarithmic curve provides smooth fade that's perceptually more natural
			return clampedProgress === 0 ? 0 : Math.log10(clampedProgress * 9 + 1)

		case 'exponential':
			// Exponential curve for more dramatic fades
			return Math.pow(clampedProgress, 2)

		default:
			return clampedProgress
	}
}

/**
 * Calculate fade-out volume for the current track
 * @param progress - Crossfade progress from 0 to 1
 * @param curve - Fade curve type
 * @returns Volume from 0 to 1
 */
export const calculateFadeOutVolume = (progress: number, curve: FadeCurve): number => {
	return 1 - calculateFadeValue(progress, curve)
}

/**
 * Calculate fade-in volume for the next track
 * @param progress - Crossfade progress from 0 to 1
 * @param curve - Fade curve type
 * @returns Volume from 0 to 1
 */
export const calculateFadeInVolume = (progress: number, curve: FadeCurve): number => {
	return calculateFadeValue(progress, curve)
}

/**
 * Crossfade state interface
 */
export interface CrossfadeState {
	isActive: boolean
	progress: number
	duration: number
	curve: FadeCurve
	startTime: number
}

/**
 * Create initial crossfade state
 */
export const createInitialCrossfadeState = (): CrossfadeState => ({
	isActive: false,
	progress: 0,
	duration: 0,
	curve: 'logarithmic',
	startTime: 0,
})

/**
 * Update crossfade progress based on current time
 * @param state - Current crossfade state
 * @param currentTime - Current timestamp in milliseconds
 * @returns Updated crossfade state
 */
export const updateCrossfadeProgress = (
	state: CrossfadeState,
	currentTime: number,
): CrossfadeState => {
	if (!state.isActive) {
		return state
	}

	const elapsed = currentTime - state.startTime
	const progress = Math.min(elapsed / (state.duration * 1000), 1)

	return {
		...state,
		progress,
		isActive: progress < 1,
	}
}

/**
 * Start a new crossfade
 * @param duration - Crossfade duration in seconds
 * @param curve - Fade curve type
 * @param startTime - Start timestamp in milliseconds
 * @returns New crossfade state
 */
export const startCrossfade = (
	duration: number,
	curve: FadeCurve,
	startTime: number = Date.now(),
): CrossfadeState => ({
	isActive: true,
	progress: 0,
	duration,
	curve,
	startTime,
})

/**
 * Check if crossfade should start based on track position and settings
 * @param currentPosition - Current track position in seconds
 * @param trackDuration - Total track duration in seconds
 * @param crossfadeDuration - Crossfade duration in seconds
 * @returns Whether crossfade should start
 */
export const shouldStartCrossfade = (
	currentPosition: number,
	trackDuration: number,
	crossfadeDuration: number,
): boolean => {
	if (crossfadeDuration <= 0 || trackDuration <= crossfadeDuration) {
		return false
	}

	const timeRemaining = trackDuration - currentPosition
	return timeRemaining <= crossfadeDuration
}
