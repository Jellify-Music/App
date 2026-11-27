import React from 'react'
import { act, renderHook } from '@testing-library/react-native'
import {
	ArtistScrollProvider,
	artistImageHeight,
	useArtistCollapsed,
	useArtistScrollY,
	useArtistTopBar,
	useReportArtistScroll,
} from '../../src/components/Artist/scroll'

let mockFocused = true

jest.mock('@react-navigation/native', () => ({
	...jest.requireActual('@react-navigation/native'),
	useIsFocused: () => mockFocused,
}))

const scrollEvent = (y: number) =>
	({ nativeEvent: { contentOffset: { x: 0, y } } }) as Parameters<
		ReturnType<typeof useReportArtistScroll>
	>[0]

const setup = () =>
	renderHook(
		() => ({
			report: useReportArtistScroll(),
			collapsed: useArtistCollapsed(),
			scrollY: useArtistScrollY(),
			bar: useArtistTopBar(),
		}),
		{ wrapper: ({ children }) => <ArtistScrollProvider>{children}</ArtistScrollProvider> },
	)

describe('the artist top bar', () => {
	beforeEach(() => {
		mockFocused = true
	})

	it('is solid once the image has scrolled up to it, and fades in over the stretch before', async () => {
		const { result } = await setup()
		const { bar } = result.current

		// the image's foot, where the name is, reaches the bar when the bar is solid
		expect(bar.fadeTo).toBe(artistImageHeight(bar.statusBarHeight) - bar.height)
		expect(bar.fadeFrom).toBeLessThan(bar.fadeTo)
		expect(bar.fadeFrom).toBeGreaterThan(0)
	})

	it('has the image collapsed from where the bar is solid, not before', async () => {
		const { result } = await setup()
		const { fadeTo } = result.current.bar

		await act(async () => result.current.report(scrollEvent(fadeTo - 1)))
		expect(result.current.collapsed).toBe(false)
		expect(result.current.scrollY.get()).toBe(fadeTo - 1)

		await act(async () => result.current.report(scrollEvent(fadeTo)))
		expect(result.current.collapsed).toBe(true)

		await act(async () => result.current.report(scrollEvent(0)))
		expect(result.current.collapsed).toBe(false)
	})

	it('only hears the tab that is on show', async () => {
		mockFocused = false
		const { result } = await setup()

		await act(async () => result.current.report(scrollEvent(5000)))

		expect(result.current.scrollY.get()).toBe(0)
		expect(result.current.collapsed).toBe(false)
	})

	it('has a tab that comes back report where it was left', async () => {
		mockFocused = false
		const { result, rerender } = await setup()
		const { fadeTo } = result.current.bar

		// scrolled while another tab was showing
		await act(async () => result.current.report(scrollEvent(fadeTo + 50)))
		expect(result.current.collapsed).toBe(false)

		mockFocused = true
		await rerender({})
		await act(async () => {})

		expect(result.current.collapsed).toBe(true)
	})
})
