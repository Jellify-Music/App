import {
	OTHER_BUCKET,
	firstLetterBucket,
	groupAlphabetically,
} from '../../src/utils/grouping/alphabetical'

describe('firstLetterBucket', () => {
	it.each([
		['ABBA', 'A'],
		['adele', 'A'],
		['Édith Piaf', 'E'],
		['  bob', 'B'],
		['2Pac', OTHER_BUCKET],
		['', OTHER_BUCKET],
		[undefined, OTHER_BUCKET],
		[null, OTHER_BUCKET],
		['(Sandy) Alex G', OTHER_BUCKET],
		['東京事変', OTHER_BUCKET],
	])('%p → %s', (name, expected) => {
		expect(firstLetterBucket(name)).toBe(expected)
	})
})

describe('groupAlphabetically', () => {
	it('orders buckets A→Z with # last and keeps item order inside a bucket', () => {
		const result = groupAlphabetically(['banana', '2pac', 'apple', 'Avocado', ''], (s) => s)

		expect(result).toEqual([
			{ letter: 'A', items: ['apple', 'Avocado'] },
			{ letter: 'B', items: ['banana'] },
			{ letter: OTHER_BUCKET, items: ['2pac', ''] },
		])
	})

	it('returns an empty array for no input', () => {
		expect(groupAlphabetically([], (s: string) => s)).toEqual([])
	})
})
