export function pickRandomItemFromArray<T>(array: readonly T[]): T {
	return array[Math.max(0, Math.min(array.length - 1, Math.floor(Math.random() * array.length)))]
}
