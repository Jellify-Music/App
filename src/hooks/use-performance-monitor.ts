import { useEffect, useRef } from 'react'

interface PerformanceMetrics {
	renderCount: number
	lastRenderTime: number
	averageRenderTime: number
	totalRenderTime: number
}

// No-op metrics for production builds
const EMPTY_METRICS: PerformanceMetrics = {
	renderCount: 0,
	lastRenderTime: 0,
	averageRenderTime: 0,
	totalRenderTime: 0,
}

/**
 * Hook to monitor component performance and detect excessive re-renders
 * @param componentName - Name of the component for logging
 * @param threshold - Number of renders before warning (default: 10)
 * @returns Performance metrics object
 */
export function usePerformanceMonitor(
	componentName: string,
	threshold: number = 10,
): PerformanceMetrics {
	// Skip all performance monitoring in production for zero overhead
	const renderCount = useRef(0)
	const renderTimes = useRef<number[]>([])
	const lastRenderStart = useRef(Date.now())
	const hasWarned = useRef(false) // Prevent repeated warnings

	useEffect(() => {
		// Don't run in production
		if (!__DEV__) return

		const renderEnd = Date.now()
		const renderTime = renderEnd - lastRenderStart.current

		renderCount.current += 1
		renderTimes.current.push(renderTime)

		// Keep only last 20 render times for average calculation
		if (renderTimes.current.length > 20) {
			renderTimes.current.shift()
		}

		// Warn about excessive re-renders (only once)
		if (renderCount.current > threshold && !hasWarned.current) {
			console.warn(
				`⚠️ Performance Warning: ${componentName} has rendered ${renderCount.current} times. Consider optimization.`,
			)
			hasWarned.current = true
		}

		// Log slow renders (but throttle to avoid spam)
		if (renderTime > 16 && renderCount.current % 5 === 0) {
			// Only log every 5th slow render
			console.warn(
				`🐌 Slow Render: ${componentName} took ${renderTime}ms to render (render #${renderCount.current})`,
			)
		}

		lastRenderStart.current = Date.now()
	})

	if (!__DEV__) return EMPTY_METRICS

	const averageRenderTime =
		renderTimes.current.length > 0
			? renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length
			: 0

	const totalRenderTime = renderTimes.current.reduce((a, b) => a + b, 0)

	return {
		renderCount: renderCount.current,
		lastRenderTime: renderTimes.current[renderTimes.current.length - 1] || 0,
		averageRenderTime,
		totalRenderTime,
	}
}

/**
 * Hook to detect context value changes that might cause unnecessary re-renders
 * @param contextValue - The context value to monitor
 * @param contextName - Name of the context for logging
 */
export function useContextChangeMonitor<T>(contextValue: T, contextName: string): void {
	const prevValue = useRef<T>(contextValue)
	const changeCount = useRef(0)

	useEffect(() => {
		if (prevValue.current !== contextValue) {
			changeCount.current += 1
			prevValue.current = contextValue
		}
	}, [contextValue, contextName])
}

/**
 * Hook to monitor array/object size changes that might indicate memory leaks
 * @param data - The data to monitor
 * @param dataName - Name of the data for logging
 * @param sizeThreshold - Threshold for warning about large data (default: 1000)
 */
export function useDataSizeMonitor<T>(
	data: T[] | Record<string, unknown>,
	dataName: string,
	sizeThreshold: number = 1000,
): void {
	const prevSize = useRef(0)

	useEffect(() => {
		const currentSize = Array.isArray(data) ? data.length : Object.keys(data).length

		if (currentSize !== prevSize.current) {
			if (currentSize > sizeThreshold) {
				console.warn(
					`⚠️ Large Data Warning: ${dataName} has ${currentSize} items (threshold: ${sizeThreshold})`,
				)
			}

			prevSize.current = currentSize
		}
	}, [data, dataName, sizeThreshold])
}

/**
 * Hook to measure the time spent in expensive operations
 * @param operationName - Name of the operation for logging
 * @returns Function to mark the start and end of an operation
 */
export function useOperationTimer(operationName: string) {
	const startTime = useRef<number | null>(null)

	const startTimer = () => {
		startTime.current = Date.now()
	}

	const endTimer = () => {
		if (startTime.current) {
			const duration = Date.now() - startTime.current
			startTime.current = null
			return duration
		}
		return 0
	}

	return { startTimer, endTimer }
}
