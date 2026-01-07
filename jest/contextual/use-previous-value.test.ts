import { renderHook, act } from '@testing-library/react-native'
import { usePreviousValue } from '../../src/hooks/use-previous-value'

describe('usePreviousValue', () => {
	it('should return initial value on first render', () => {
		const { result } = renderHook(() => usePreviousValue(true))

		// On first render, previous value should be the initial value
		expect(result.current).toBe(true)
	})

	it('should return previous value after state change', () => {
		let currentValue = true

		const { result, rerender } = renderHook(() => usePreviousValue(currentValue))

		// First render: previous is current value (true)
		expect(result.current).toBe(true)

		// Change value and rerender
		currentValue = false
		rerender(() => usePreviousValue(currentValue))

		// After rerender, should return the PREVIOUS value (true)
		expect(result.current).toBe(true)
	})

	it('should track value through multiple changes', () => {
		let currentValue = false
		const { result, rerender } = renderHook(() => usePreviousValue(currentValue))

		// Initial: false
		expect(result.current).toBe(false)

		// Change to true
		currentValue = true
		rerender(() => usePreviousValue(currentValue))
		expect(result.current).toBe(false) // Previous was false

		// Change back to false
		currentValue = false
		rerender(() => usePreviousValue(currentValue))
		expect(result.current).toBe(true) // Previous was true
	})

	it('should return same value when not changed', () => {
		const { result, rerender } = renderHook(() => usePreviousValue(true))

		expect(result.current).toBe(true)

		// Rerender without changing value
		rerender(() => usePreviousValue(true))
		expect(result.current).toBe(true)
	})
})
