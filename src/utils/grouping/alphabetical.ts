export const OTHER_BUCKET = '#'

export type AlphabeticalGroup<T> = { letter: string; items: T[] }

/**
 * Bucket letter for a display name: trim → NFD → strip combining marks → uppercase → first char.
 * `A`–`Z` keep their letter; digits, symbols, empty names and non-Latin scripts go to `#`.
 */
export function firstLetterBucket(name: string | null | undefined): string {
	const first = (name ?? '').trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().charAt(0)

	return /[A-Z]/.test(first) ? first : OTHER_BUCKET
}

/**
 * Groups items by {@link firstLetterBucket}. Buckets come back A→Z with `#` last;
 * items keep their input order inside a bucket.
 */
export function groupAlphabetically<T>(
	items: T[],
	getName: (item: T) => string | null | undefined,
): AlphabeticalGroup<T>[] {
	const buckets = new Map<string, T[]>()

	for (const item of items) {
		const letter = firstLetterBucket(getName(item))
		const bucket = buckets.get(letter) ?? []
		bucket.push(item)
		buckets.set(letter, bucket)
	}

	return Array.from(buckets, ([letter, bucketItems]) => ({ letter, items: bucketItems })).sort(
		(a, b) => {
			if (a.letter === OTHER_BUCKET) return 1
			if (b.letter === OTHER_BUCKET) return -1
			return a.letter.localeCompare(b.letter)
		},
	)
}
