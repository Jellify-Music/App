/**
 * Unified server connection hook that supports both Jellyfin and Navidrome.
 * Uses auto-detection to determine server type.
 */

import { useMutation } from '@tanstack/react-query'
import { JellifyServer } from '@/src/types/JellifyServer'
import useJellifyStore from '../../../stores'
import {
	detectServerType,
	normalizeServerUrl,
	ServerDetectionResult,
} from '../../core/server-detection'
import { ServerBackend } from '../../core/types'
import HTTPS, { HTTP } from '../../../constants/protocols'

interface ConnectToServerMutation {
	serverAddress: string
	useHttps: boolean
}

interface ConnectToServerHook {
	onSuccess?: (server: JellifyServer, detectedBackend: ServerBackend) => void
	onError?: (error: Error) => void
	onDetecting?: () => void
}

/**
 * Connects to a server using auto-detection to determine if it's Jellyfin or Navidrome.
 */
async function connectWithAutoDetect(
	serverAddress: string,
	useHttps: boolean,
): Promise<{ server: JellifyServer; detection: ServerDetectionResult }> {
	// Build the full URL
	const hasProtocol = serverAddress.includes('://')
	const protocol = hasProtocol ? '' : useHttps ? HTTPS : HTTP
	const fullUrl = normalizeServerUrl(`${protocol}${serverAddress}`)

	// Auto-detect server type
	const detection = await detectServerType(fullUrl)

	if (!detection) {
		throw new Error('Unable to detect server type. Please check the server address.')
	}

	const server: JellifyServer = {
		url: fullUrl,
		address: serverAddress,
		name: detection.serverName,
		version: detection.version,
		startUpComplete: true, // Assume true if we can connect
		backend: detection.backend,
	}

	return { server, detection }
}

/**
 * Hook for connecting to a music server with auto-detection.
 * Replaces usePublicSystemInfo for unified Jellyfin/Navidrome support.
 */
export const useConnectToServer = ({ onSuccess, onError, onDetecting }: ConnectToServerHook) => {
	const setServer = useJellifyStore((state) => state.setServer)

	return useMutation({
		mutationFn: async ({ serverAddress, useHttps }: ConnectToServerMutation) => {
			onDetecting?.()
			return connectWithAutoDetect(serverAddress, useHttps)
		},
		onSuccess: ({ server, detection }) => {
			setServer(server)
			onSuccess?.(server, detection.backend)
		},
		onError: (error: Error) => {
			console.error('An error occurred connecting to the server', error)
			setServer(undefined)
			onError?.(error)
		},
	})
}

export default useConnectToServer
