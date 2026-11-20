import { blurhashLuminance } from '../../src/utils/parsing/blurhash-luminance'

// Hashes from the blurhash reference implementation's examples
describe('blurhashLuminance', () => {
	it('is near 0 for an all-black 1x1 blurhash', () => {
		// 1x1 components, no AC, DC = rgb(0, 0, 0): "00" + "0000"
		expect(blurhashLuminance('000000')).toBeCloseTo(0, 5)
	})

	it('is near 1 for an all-white 1x1 blurhash', () => {
		// DC = 0xFFFFFF, encoded in base 83
		const digits =
			'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~'
		let value = 0xffffff
		let encoded = ''
		for (let i = 0; i < 4; i++) {
			encoded = digits[value % 83] + encoded
			value = Math.floor(value / 83)
		}
		expect(blurhashLuminance('00' + encoded)).toBeCloseTo(1, 3)
	})

	it('tells a bright top from a dark top in a real, two-row blurhash', () => {
		// 1 column x 2 rows: sizeFlag = (2 - 1) * 9 + (1 - 1) = 9 -> '9'; the AC of the second row
		// decides whether the top is brighter or darker than the average
		const digits =
			'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~'
		const encode = (n: number, len: number) => {
			let out = ''
			for (let i = 0; i < len; i++) {
				out = digits[n % 83] + out
				n = Math.floor(n / 83)
			}
			return out
		}
		const grey = encode(0x808080, 4)
		// all three channels at the same step: 18 (max) is far brighter at the top, 0 far darker
		const bright = encode(18 * 361 + 18 * 19 + 18, 2)
		const dark = encode(0, 2)

		const top = blurhashLuminance('9' + '~' + grey + bright, 0)!
		const bottom = blurhashLuminance('9' + '~' + grey + bright, 1)!
		expect(top).toBeGreaterThan(bottom)

		expect(blurhashLuminance('9' + '~' + grey + dark, 0)!).toBeLessThan(
			blurhashLuminance('9' + '~' + grey + dark, 1)!,
		)
	})

	it('gives up on anything that is not a blurhash', () => {
		expect(blurhashLuminance('')).toBeUndefined()
		expect(blurhashLuminance('abc')).toBeUndefined()
		expect(blurhashLuminance('00000')).toBeUndefined()
		expect(blurhashLuminance('0000000')).toBeUndefined() // wrong length for 1x1
	})
})
