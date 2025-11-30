import { State } from 'react-native-track-player'
import { Circle, Spinner, View } from 'tamagui'
import IconButton from '../../../components/Global/helpers/icon-button'
import { isUndefined } from 'lodash'
import { useTogglePlayback } from '../../../providers/Player/hooks/mutations'
import { usePlaybackState } from '../../../providers/Player/hooks/queries'
import React, { useEffect, useMemo, useState } from 'react'
import Icon from '../../Global/components/icon'

function PlayPauseButtonComponent({
	size,
	flex,
}: {
	size?: number | undefined
	flex?: number | undefined
}): React.JSX.Element {
	const togglePlayback = useTogglePlayback()

	const state = usePlaybackState()
	const [pendingState, setPendingState] = useState<State | null>(null)

	// Clear optimistic state once the real state catches up
	useEffect(() => {
		if (pendingState === null) return
		if (state === pendingState) setPendingState(null)
	}, [state, pendingState])

	const effectiveState = useMemo(() => {
		// Optimistically flip the UI immediately after a toggle request
		if (pendingState === State.Paused && state === State.Playing) return State.Paused
		if (pendingState === State.Playing && (state === State.Paused || state === State.Ready))
			return State.Playing
		return state
	}, [state, pendingState])

	const largeIcon = useMemo(() => isUndefined(size) || size >= 24, [size])

	const button = useMemo(() => {
		switch (effectiveState) {
			case State.Playing: {
				return (
					<IconButton
						circular
						largeIcon={largeIcon}
						size={size}
						name='pause'
						testID='pause-button-test-id'
						onPress={async () => {
							setPendingState(State.Paused)
							await togglePlayback()
						}}
					/>
				)
			}

			case State.Buffering:
			case State.Loading: {
				return (
					<Circle size={size} disabled borderWidth={'$1.5'} borderColor={'$primary'}>
						<Spinner margin={10} size='small' color={'$primary'} />
					</Circle>
				)
			}

			default: {
				return (
					<IconButton
						circular
						largeIcon={largeIcon}
						size={size}
						name='play'
						testID='play-button-test-id'
						onPress={async () => {
							setPendingState(State.Playing)
							await togglePlayback()
						}}
					/>
				)
			}
		}
	}, [effectiveState, size, largeIcon, togglePlayback])

	return (
		<View justifyContent='center' alignItems='center' flex={flex}>
			{button}
		</View>
	)
}

const PlayPauseButton = React.memo(PlayPauseButtonComponent)

export function PlayPauseIcon(): React.JSX.Element {
	const togglePlayback = useTogglePlayback()
	const state = usePlaybackState()

	const button = useMemo(() => {
		switch (state) {
			case State.Playing: {
				return <Icon name='pause' color='$primary' onPress={togglePlayback} />
			}

			case State.Buffering:
			case State.Loading: {
				return <Spinner margin={10} color={'$primary'} />
			}

			default: {
				return <Icon name='play' color='$primary' onPress={togglePlayback} />
			}
		}
	}, [state, togglePlayback])

	return button
}

export default PlayPauseButton
