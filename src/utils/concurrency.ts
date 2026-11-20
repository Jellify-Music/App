/** Splits a list into consecutive pieces of at most `size` */
export function chunk<T>(items: T[], size: number): T[][] {
	const pieces: T[][] = []

	for (let i = 0; i < items.length; i += size) pieces.push(items.slice(i, i + size))

	return pieces
}

/**
 * Maps a list through an async function, running at most `limit` at a time. Results are in the
 * order of the list, and the first rejection rejects the whole thing.
 */
export async function mapWithConcurrency<T, R>(
	items: T[],
	limit: number,
	map: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
	const results: R[] = new Array(items.length)
	let next = 0

	const worker = async () => {
		while (next < items.length) {
			const index = next++
			results[index] = await map(items[index], index)
		}
	}

	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))

	return results
}
