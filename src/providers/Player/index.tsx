import { usePerformanceMonitor } from '../../hooks/use-performance-monitor'
import { createContext, useEffect, useRef } from 'react'
import Initialize from './utils/initialization'
import usePostFullCapabilities from '../../api/mutations/session'

interface PlayerContext {}

export const PlayerContext = createContext<PlayerContext>({})

export const PlayerProvider: () => React.JSX.Element = () => {
	const initialized = useRef(false)

	usePostFullCapabilities()

	usePerformanceMonitor('PlayerProvider', 3)

	useEffect(() => {
		if (!initialized.current) {
			Initialize()
			initialized.current = true
		}
	}, [])

	return <PlayerContext value={{}} />
}
