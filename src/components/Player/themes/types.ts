import type { SharedValue } from 'react-native-reanimated'
import type JellifyTrack from '../../../types/JellifyTrack'
import type { PlayerThemeId } from '../../../stores/settings/player-theme'

/**
 * Metadata for a player theme, used in settings UI
 */
export interface PlayerThemeMetadata {
	id: PlayerThemeId
	name: string
	description: string
	/** Icon name from material-design-icons */
	icon: string
	/** Whether this theme is experimental/beta */
	experimental?: boolean
}

/**
 * Props passed to all theme components
 */
export interface PlayerThemeProps {
	/** Current track data */
	nowPlaying: JellifyTrack
	/** Shared animated value for horizontal swipe gestures */
	swipeX: SharedValue<number>
	/** Dimensions from useWindowDimensions */
	dimensions: { width: number; height: number }
	/** Safe area insets */
	insets: { top: number; bottom: number; left: number; right: number }
}

/**
 * Interface that each theme must implement
 */
export interface PlayerThemeComponent {
	/** The main player component */
	Player: React.ComponentType<PlayerThemeProps>
	/** Static preview for settings (no playback logic) */
	Preview: React.ComponentType<{ width: number; height: number }>
	/** Theme metadata */
	metadata: PlayerThemeMetadata
}
