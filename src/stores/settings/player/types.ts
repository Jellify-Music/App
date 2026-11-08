import { StateCreator } from 'zustand'
import { StreamingQuality } from '../../../enums/audio-quality'

export type PlayerSettingsStore = {
	streamingQuality: StreamingQuality
	setStreamingQuality: (streamingQuality: StreamingQuality) => void

	enableAudioNormalization: boolean
	setEnableAudioNormalization: (enabled: boolean) => void

	displayAudioQualityBadge: boolean
	setDisplayAudioQualityBadge: (displayAudioQualityBadge: boolean) => void

	lookahead: number
	setLookahead: (lookahead: number) => Promise<void>
}

type PlayerSettingsStoreMutators = [['zustand/devtools', never], ['zustand/persist', unknown]]

type PlayerSettingsStoreCreator = StateCreator<PlayerSettingsStore, PlayerSettingsStoreMutators>

export type PlayerSettingsStoreSet = Parameters<PlayerSettingsStoreCreator>[0]
