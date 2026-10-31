import type JellifyStore from '@/src/stores/auth/types'
import useJellifyStore from '../../stores/auth'
import { useShallow } from 'zustand/react/shallow'

type UseJellifyServerResult = [JellifyStore['server'], JellifyStore['setServer']]

/**
 * Hook to access and update the current Jellyfin server.
 * @returns A tuple containing the current Jellyfin server and a function to update it.
 */
export const useJellyfinServer: () => UseJellifyServerResult = () => {
	return useJellifyStore(useShallow((state) => [state.server, state.setServer] as const))
}
