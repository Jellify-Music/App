import { useEffect, useRef } from 'react'

interface PerformanceMetrics {
	renderCount: number
	lastRenderTime: number
	averageRenderTime: number
	totalRenderTime: number
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
	const renderCount = useRef(0)
	const renderTimes = useRef<number[]>([])
	const lastRenderStart = useRef(Date.now())
	const hasWarned = useRef(false) // Prevent repeated warnings

	useEffect(() => {
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
export function useContextChangeDetector<T>(contextValue: T, contextName: string): void {
	const previousValue = useRef<T>(contextValue)

	useEffect(() => {
		if (previousValue.current !== contextValue) {
			console.log(`🔄 Context Change: ${contextName}`, {
				previous: previousValue.current,
				current: contextValue,
			})
			previousValue.current = contextValue
		}
	}, [contextValue, contextName])
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
			console.log(`⏱️ Operation Timer: ${operationName} took ${duration}ms`)
			startTime.current = null
			return duration
		}
		return 0
	}

	return { startTimer, endTimer }
}
