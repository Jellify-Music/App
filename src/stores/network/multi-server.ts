/**
 * Multi-server management store.
 * Handles saved servers for quick switching between Jellyfin and Navidrome instances.
 */

import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { mmkvStateStorage } from '../../constants/storage'
import { JellifyLibrary } from '../../types/JellifyLibrary'
import { JellifyServer } from '../../types/JellifyServer'
import { JellifyUser } from '../../types/JellifyUser'

/**
 * A saved server configuration including credentials.
 */
export interface SavedServer {
	server: JellifyServer
	user: JellifyUser
	library?: JellifyLibrary
	/** When this server was last used */
	lastUsed?: string
}

interface MultiServerStore {
	/** List of saved servers for quick switching */
	savedServers: SavedServer[]

	/** Add or update a saved server */
	saveServer: (savedServer: SavedServer) => void

	/** Remove a saved server by URL */
	removeServer: (url: string) => void

	/** Clear all saved servers */
	clearServers: () => void
}

const useMultiServerStore = create<MultiServerStore>()(
	devtools(
		persist(
			(set, _get) => ({
				savedServers: [],

				saveServer: (savedServer: SavedServer) =>
					set((state) => {
						const existingIndex = state.savedServers.findIndex(
							(s) => s.server.url === savedServer.server.url,
						)

						const updatedServer = {
							...savedServer,
							lastUsed: new Date().toISOString(),
						}

						if (existingIndex >= 0) {
							// Update existing
							const updated = [...state.savedServers]
							updated[existingIndex] = updatedServer
							return { savedServers: updated }
						} else {
							// Add new
							return { savedServers: [...state.savedServers, updatedServer] }
						}
					}),

				removeServer: (url: string) =>
					set((state) => ({
						savedServers: state.savedServers.filter((s) => s.server.url !== url),
					})),

				clearServers: () => set({ savedServers: [] }),
			}),
			{
				name: 'jellify-multi-server-storage',
				storage: createJSONStorage(() => mmkvStateStorage),
			},
		),
	),
)

/**
 * Hook to access saved servers.
 */
export const useSavedServers = () => {
	return useMultiServerStore(useShallow((state) => state.savedServers))
}

/**
 * Hook to get server management actions.
 */
export const useServerManagement = () => {
	return useMultiServerStore(
		useShallow((state) => ({
			saveServer: state.saveServer,
			removeServer: state.removeServer,
			clearServers: state.clearServers,
		})),
	)
}

export default useMultiServerStore
