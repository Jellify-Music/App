/**
 * Converts the run time seconds of a track to the RunTimeTicks standard set by Emby / Jellyfin
 * @param seconds The run time seconds of the item to convert to Jellyfin ticks
 * @returns the run time seconds of a track converted to Jellyfin runtimeticks
 *
 * @see https://emby.media/community/index.php?/topic/63357-runtimeticks-microseconds-milliseconds-or-nanoseconds/
 */
export function convertSecondsToRunTimeTicks(seconds: number) {
	'worklet'
	const runTimeMilliseconds = seconds * 1000 * 10000
	return runTimeMilliseconds
}

/**
 * Converts a {@link BaseItemDto}'s RunTimeTicks to seconds
 * @param ticks The run time ticks of the item to convert to seconds
 * @returns The run time ticks of a track converted to seconds
 *
 * @see https://emby.media/community/index.php?/topic/63357-runtimeticks-microseconds-milliseconds-or-nanoseconds/
 */
export function convertRunTimeTicksToSeconds(ticks: number) {
	'worklet'
	const runTimeMilliseconds = ticks / 10000
	const runTimeTotalSeconds = Math.floor(runTimeMilliseconds / 1000)
	return runTimeTotalSeconds
}
