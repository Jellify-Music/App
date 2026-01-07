import { Capability } from 'react-native-track-player'

export const CAPABILITIES: Capability[] = [
	Capability.Pause,
	Capability.Play,
	Capability.PlayFromId,
	Capability.SeekTo,
	// Capability.JumpForward,
	// Capability.JumpBackward,
	Capability.SkipToNext,
	Capability.SkipToPrevious,
	// Capability.Like,
	// Capability.Dislike
]
