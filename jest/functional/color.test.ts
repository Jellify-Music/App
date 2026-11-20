import { transparentOf } from '../../src/utils/color'

describe('transparentOf', () => {
	it('keeps a hex colour and drops its opacity', () => {
		expect(transparentOf('#19181c')).toBe('#19181c00')
		expect(transparentOf('#19181CFF')).toBe('#19181C00')
	})

	it('keeps an rgb or rgba colour and drops its opacity', () => {
		expect(transparentOf('rgb(25, 24, 28)')).toBe('rgba(25, 24, 28, 0)')
		expect(transparentOf('rgba(25,24,28,0.75)')).toBe('rgba(25, 24, 28, 0)')
	})

	it('falls back to plain transparent for anything else', () => {
		expect(transparentOf('red')).toBe('transparent')
	})
})
