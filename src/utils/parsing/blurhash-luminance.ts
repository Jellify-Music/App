const BASE83 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~'

function decode83(text: string): number {
	let value = 0
	for (const char of text) {
		const digit = BASE83.indexOf(char)
		if (digit < 0) return NaN
		value = value * 83 + digit
	}
	return value
}

const srgbToLinear = (value: number): number => {
	const v = value / 255
	return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

const signedSquare = (value: number): number => Math.sign(value) * value * value

/**
 * The luminance (0 black to 1 white, in linear light) of an image's top edge, read from its
 * blurhash without decoding the image.
 *
 * A blurhash is a handful of cosine components. Averaged across the width every horizontal
 * frequency cancels out, which leaves the first column of components to describe how the colour
 * changes from the top of the image to the bottom.
 *
 * @param blurhash The blurhash of the image
 * @param y How far down to look, from 0 (the top edge) to 1 (the bottom)
 * @returns The luminance there, or undefined if the blurhash can't be read
 */
export function blurhashLuminance(blurhash: string, y: number = 0.05): number | undefined {
	if (blurhash.length < 6) return undefined

	const sizeFlag = decode83(blurhash[0])
	const numY = Math.floor(sizeFlag / 9) + 1
	const numX = (sizeFlag % 9) + 1

	if (Number.isNaN(sizeFlag) || blurhash.length !== 4 + 2 * numX * numY) return undefined

	const maxValue = (decode83(blurhash[1]) + 1) / 166

	// the first column of components: the average colour, then the vertical changes of it
	const column: [number, number, number][] = []

	for (let j = 0; j < numY; j++) {
		const index = j * numX

		if (index === 0) {
			const dc = decode83(blurhash.substring(2, 6))
			column.push([
				srgbToLinear(dc >> 16),
				srgbToLinear((dc >> 8) & 255),
				srgbToLinear(dc & 255),
			])
		} else {
			const ac = decode83(blurhash.substring(4 + index * 2, 6 + index * 2))
			column.push([
				signedSquare((Math.floor(ac / (19 * 19)) - 9) / 9) * maxValue,
				signedSquare(((Math.floor(ac / 19) % 19) - 9) / 9) * maxValue,
				signedSquare(((ac % 19) - 9) / 9) * maxValue,
			])
		}
	}

	const [r, g, b] = column.reduce<[number, number, number]>(
		(sum, component, j) => {
			const weight = Math.cos(Math.PI * y * j)
			return [
				sum[0] + component[0] * weight,
				sum[1] + component[1] * weight,
				sum[2] + component[2] * weight,
			]
		},
		[0, 0, 0],
	)

	const clamp = (value: number) => Math.min(1, Math.max(0, value))

	return 0.2126 * clamp(r) + 0.7152 * clamp(g) + 0.0722 * clamp(b)
}

/** The luminance where white and black text are equally easy to read; brighter than this wants dark text */
export const LUMINANCE_CONTRAST_MIDPOINT = 0.179
