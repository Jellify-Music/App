import { Capability } from '../providers/Player/native'

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
