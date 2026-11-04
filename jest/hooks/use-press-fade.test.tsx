import { act, renderHook } from '@testing-library/react-native'
import usePressFade from '../../src/hooks/use-press-fade'

const event = {} as never

describe('usePressFade', () => {
	it('renders without an animation driver until first pressed', async () => {
		const { result } = await renderHook(() => usePressFade('1 press:0.5'))

		expect(result.current.transition).toBeUndefined()
		// the press opacity must always be set so the very first tap still dims
		expect(result.current.opacity).toBe('1 press:0.5')
	})

	it('attaches the animation on first press and keeps it', async () => {
		const { result } = await renderHook(() => usePressFade('1 press:0.5'))

		await act(async () => result.current.onPressIn(event))
		expect(result.current.transition).toBe('quick')

		await act(async () => result.current.onPressIn(event))
		expect(result.current.transition).toBe('quick')
	})

	it('forwards the original onPressIn handler', async () => {
		const handler = jest.fn()
		const { result } = await renderHook(() => usePressFade('1 press:0.5', true, handler))

		await act(async () => result.current.onPressIn(event))
		expect(handler).toHaveBeenCalledTimes(1)
		expect(handler).toHaveBeenCalledWith(event)
	})

	it('does nothing when the element is not pressable', async () => {
		const { result } = await renderHook(() => usePressFade('1 press:0.5', false))

		await act(async () => result.current.onPressIn(event))
		expect(result.current.transition).toBeUndefined()
		expect(result.current.opacity).toBeUndefined()
	})
})
