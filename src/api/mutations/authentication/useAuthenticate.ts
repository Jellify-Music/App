/**
 * Unified authentication hook that supports both Jellyfin and Navidrome.
 */

import { useMutation } from '@tanstack/react-query'
import { JellifyUser } from '../../../types/JellifyUser'
import { useApi, useJellifyServer, useJellifyUser } from '../../../stores'
import authenticateUserByName from './utils'

interface AuthenticateUserMutation {
	onSuccess?: () => void
	onError?: (error: Error) => void
}

interface Credentials {
	username: string
	password?: string
}

/**
 * Convert password to hex encoding for Subsonic legacy auth.
 * Subsonic API accepts hex-encoded passwords with "enc:" prefix.
 */
function hexEncode(str: string): string {
	return Array.from(str)
		.map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
		.join('')
}

/**
 * Authenticate with a Navidrome/Subsonic server using legacy hex-encoded password.
 * This avoids the need for MD5/crypto which isn't available in React Native.
 */
async function authenticateNavidrome(
	serverUrl: string,
	username: string,
	password: string,
): Promise<JellifyUser> {
	// Use hex-encoded password (legacy Subsonic auth, works with Navidrome)
	const hexPassword = `enc:${hexEncode(password)}`

	// Build ping URL to test authentication
	const params = new URLSearchParams({
		u: username,
		p: hexPassword,
		v: '1.16.1',
		c: 'jellify',
		f: 'json',
	})

	const response = await fetch(`${serverUrl}/rest/ping.view?${params.toString()}`)

	if (!response.ok) {
		throw new Error(`Server returned ${response.status}`)
	}

	const data = await response.json()
	const subsonicResponse = data['subsonic-response']

	if (!subsonicResponse) {
		throw new Error('Invalid server response')
	}

	if (subsonicResponse.status === 'failed') {
		const errorMessage = subsonicResponse.error?.message || 'Authentication failed'
		throw new Error(errorMessage)
	}

	// Auth successful - store credentials for later API calls
	return {
		id: username, // Navidrome uses username as ID
		name: username,
		accessToken: password, // Store plain password to re-encode for each request
	}
}

/**
 * Unified authentication hook that works with both Jellyfin and Navidrome.
 */
const useAuthenticate = ({ onSuccess, onError }: AuthenticateUserMutation) => {
	const api = useApi()
	const [server] = useJellifyServer()
	const [, setUser] = useJellifyUser()

	return useMutation({
		mutationFn: async (credentials: Credentials) => {
			const { username, password } = credentials

			if (!server) {
				throw new Error('No server configured')
			}

			// Default to 'jellyfin' for backwards compatibility
			const backend = server.backend ?? 'jellyfin'

			if (backend === 'navidrome') {
				return authenticateNavidrome(server.url, username, password ?? '')
			} else {
				// Jellyfin authentication
				if (!api) {
					throw new Error('API not initialized')
				}
				const authResult = await authenticateUserByName(api, username, password)
				return {
					id: authResult.User!.Id!,
					name: authResult.User!.Name!,
					accessToken: authResult.AccessToken as string,
				} as JellifyUser
			}
		},
		onSuccess: (user: JellifyUser) => {
			setUser(user)
			onSuccess?.()
		},
		onError: (error: Error) => {
			console.error('Authentication failed', error)
			onError?.(error)
		},
		retry: 0,
		gcTime: 0,
	})
}

export default useAuthenticate
