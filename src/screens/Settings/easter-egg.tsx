import React, { useState } from 'react'
import { View, Dimensions, StyleSheet, Image } from 'react-native'
import { Text } from '../../components/Global/helpers/text'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { SettingsStackParamList } from './types'
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	useFrameCallback,
	runOnJS,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'

type EasterEggProps = NativeStackScreenProps<SettingsStackParamList, 'EasterEgg'>

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// Game Constants
const BIRD_SIZE = 55
const GRAVITY = 0.45
const JUMP_VELOCITY = -10
const PIPE_WIDTH = 75
const PIPE_GAP = 240
const PIPE_SPEED = 2.0
const GROUND_HEIGHT = 100

export default function EasterEgg({ navigation }: EasterEggProps): React.JSX.Element {
	// Game state
	const birdY = useSharedValue(SCREEN_HEIGHT / 2 - BIRD_SIZE / 2)
	const birdVelocity = useSharedValue(0)
	const birdRotation = useSharedValue(0)
	const gameStarted = useSharedValue(false)
	const gameOver = useSharedValue(false)
	const score = useSharedValue(0)

	// React state for displaying score (updated from worklet)
	const [displayScore, setDisplayScore] = useState(0)

	// Pipes
	const pipe1X = useSharedValue(SCREEN_WIDTH + 200)
	const pipe1Height = useSharedValue(
		Math.random() * (SCREEN_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 100) + 50,
	)
	const pipe1Scored = useSharedValue(false)

	const pipe2X = useSharedValue(SCREEN_WIDTH + 200 + SCREEN_WIDTH / 2 + PIPE_WIDTH)
	const pipe2Height = useSharedValue(
		Math.random() * (SCREEN_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 100) + 50,
	)
	const pipe2Scored = useSharedValue(false)

	const pipe3X = useSharedValue(SCREEN_WIDTH + 200 + SCREEN_WIDTH + PIPE_WIDTH * 2)
	const pipe3Height = useSharedValue(
		Math.random() * (SCREEN_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 100) + 50,
	)
	const pipe3Scored = useSharedValue(false)

	// Reset game function
	const resetGame = () => {
		'worklet'
		birdY.value = SCREEN_HEIGHT / 2 - BIRD_SIZE / 2
		birdVelocity.value = 0
		birdRotation.value = 0
		gameStarted.value = false
		gameOver.value = false
		score.value = 0
		runOnJS(setDisplayScore)(0)

		pipe1X.value = SCREEN_WIDTH + 200
		pipe1Height.value = Math.random() * (SCREEN_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 100) + 50
		pipe1Scored.value = false

		pipe2X.value = SCREEN_WIDTH + 200 + SCREEN_WIDTH / 2 + PIPE_WIDTH
		pipe2Height.value = Math.random() * (SCREEN_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 100) + 50
		pipe2Scored.value = false

		pipe3X.value = SCREEN_WIDTH + 200 + SCREEN_WIDTH + PIPE_WIDTH * 2
		pipe3Height.value = Math.random() * (SCREEN_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 100) + 50
		pipe3Scored.value = false
	}

	// Collision detection
	const checkCollision = (pipeX: number, pipeTopHeight: number, birdYPos: number): boolean => {
		'worklet'
		const birdLeft = SCREEN_WIDTH / 2 - BIRD_SIZE / 2
		const birdRight = birdLeft + BIRD_SIZE
		const birdTop = birdYPos
		const birdBottom = birdYPos + BIRD_SIZE

		const pipeLeft = pipeX
		const pipeRight = pipeX + PIPE_WIDTH

		// Check if bird is in pipe's horizontal range
		if (birdRight > pipeLeft && birdLeft < pipeRight) {
			// Check collision with top pipe or bottom pipe
			if (birdTop < pipeTopHeight || birdBottom > pipeTopHeight + PIPE_GAP) {
				return true
			}
		}

		// Check ground collision
		if (birdBottom > SCREEN_HEIGHT - GROUND_HEIGHT) {
			return true
		}

		// Check ceiling collision
		if (birdTop < 0) {
			return true
		}

		return false
	}

	// Check if bird passed a pipe for scoring
	const checkPipePass = (pipeX: number, scored: boolean): boolean => {
		'worklet'
		const birdLeft = SCREEN_WIDTH / 2 - BIRD_SIZE / 2
		return !scored && pipeX + PIPE_WIDTH < birdLeft
	}

	// High-performance game loop using Reanimated's useFrameCallback (runs on UI thread)
	useFrameCallback((frameInfo) => {
		'worklet'
		if (!gameStarted.value || gameOver.value) {
			return
		}

		// Update bird physics (runs every frame at 60fps)
		birdVelocity.value += GRAVITY
		birdY.value += birdVelocity.value

		// Update bird rotation based on velocity
		birdRotation.value = Math.min(Math.max(birdVelocity.value * 3, -30), 90)

		// Update pipes
		pipe1X.value -= PIPE_SPEED
		pipe2X.value -= PIPE_SPEED
		pipe3X.value -= PIPE_SPEED

		// Reset pipes when they go off screen
		if (pipe1X.value < -PIPE_WIDTH) {
			pipe1X.value = SCREEN_WIDTH
			pipe1Height.value =
				Math.random() * (SCREEN_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 100) + 50
			pipe1Scored.value = false
		}
		if (pipe2X.value < -PIPE_WIDTH) {
			pipe2X.value = SCREEN_WIDTH
			pipe2Height.value =
				Math.random() * (SCREEN_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 100) + 50
			pipe2Scored.value = false
		}
		if (pipe3X.value < -PIPE_WIDTH) {
			pipe3X.value = SCREEN_WIDTH
			pipe3Height.value =
				Math.random() * (SCREEN_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 100) + 50
			pipe3Scored.value = false
		}

		// Check scoring
		if (checkPipePass(pipe1X.value, pipe1Scored.value)) {
			pipe1Scored.value = true
			score.value += 1
			runOnJS(setDisplayScore)(score.value)
		}
		if (checkPipePass(pipe2X.value, pipe2Scored.value)) {
			pipe2Scored.value = true
			score.value += 1
			runOnJS(setDisplayScore)(score.value)
		}
		if (checkPipePass(pipe3X.value, pipe3Scored.value)) {
			pipe3Scored.value = true
			score.value += 1
			runOnJS(setDisplayScore)(score.value)
		}

		// Check collisions
		if (
			checkCollision(pipe1X.value, pipe1Height.value, birdY.value) ||
			checkCollision(pipe2X.value, pipe2Height.value, birdY.value) ||
			checkCollision(pipe3X.value, pipe3Height.value, birdY.value)
		) {
			gameOver.value = true
		}
	})

	// Tap gesture to jump
	const tapGesture = Gesture.Tap().onStart(() => {
		if (gameOver.value) {
			resetGame()
			return
		}

		if (!gameStarted.value) {
			gameStarted.value = true
		}

		birdVelocity.value = JUMP_VELOCITY
	})

	// Bird animated style
	const birdStyle = useAnimatedStyle(() => {
		return {
			transform: [{ translateY: birdY.value }, { rotate: `${birdRotation.value}deg` }],
		}
	})

	// Pipe animated styles
	const pipe1Style = useAnimatedStyle(() => ({
		transform: [{ translateX: pipe1X.value }],
	}))

	const pipe2Style = useAnimatedStyle(() => ({
		transform: [{ translateX: pipe2X.value }],
	}))

	const pipe3Style = useAnimatedStyle(() => ({
		transform: [{ translateX: pipe3X.value }],
	}))

	const pipe1TopStyle = useAnimatedStyle(() => ({
		height: pipe1Height.value,
	}))

	const pipe1BottomStyle = useAnimatedStyle(() => ({
		top: pipe1Height.value + PIPE_GAP,
	}))

	const pipe2TopStyle = useAnimatedStyle(() => ({
		height: pipe2Height.value,
	}))

	const pipe2BottomStyle = useAnimatedStyle(() => ({
		top: pipe2Height.value + PIPE_GAP,
	}))

	const pipe3TopStyle = useAnimatedStyle(() => ({
		height: pipe3Height.value,
	}))

	const pipe3BottomStyle = useAnimatedStyle(() => ({
		top: pipe3Height.value + PIPE_GAP,
	}))

	// Score animated style
	const scoreStyle = useAnimatedStyle(() => ({
		opacity: gameStarted.value ? 1 : 0,
	}))

	// Start overlay style
	const startOverlayStyle = useAnimatedStyle(() => ({
		opacity: !gameStarted.value && !gameOver.value ? 1 : 0,
		pointerEvents:
			!gameStarted.value && !gameOver.value ? ('auto' as const) : ('none' as const),
	}))

	// Game over overlay style
	const gameOverStyle = useAnimatedStyle(() => ({
		opacity: gameOver.value ? 1 : 0,
		pointerEvents: gameOver.value ? ('auto' as const) : ('none' as const),
	}))

	return (
		<GestureDetector gesture={tapGesture}>
			<View style={styles.container}>
				{/* Sky Background */}
				<View style={styles.sky}>
					{/* Decorative clouds */}
					<View style={styles.cloud1} />
					<View style={styles.cloud2} />
					<View style={styles.cloud3} />
				</View>

				{/* Score */}
				<Animated.View style={[styles.scoreContainer, scoreStyle]}>
					<Text style={styles.scoreText}>{String(displayScore)}</Text>
				</Animated.View>

				{/* Pipes */}
				<Animated.View style={[styles.pipeContainer, pipe1Style]}>
					<Animated.View style={[styles.pipeTop, pipe1TopStyle]} />
					<Animated.View style={[styles.pipeBottom, pipe1BottomStyle]} />
				</Animated.View>

				<Animated.View style={[styles.pipeContainer, pipe2Style]}>
					<Animated.View style={[styles.pipeTop, pipe2TopStyle]} />
					<Animated.View style={[styles.pipeBottom, pipe2BottomStyle]} />
				</Animated.View>

				<Animated.View style={[styles.pipeContainer, pipe3Style]}>
					<Animated.View style={[styles.pipeTop, pipe3TopStyle]} />
					<Animated.View style={[styles.pipeBottom, pipe3BottomStyle]} />
				</Animated.View>

				{/* Bird (Jellify Logo) */}
				<Animated.View style={[styles.bird, birdStyle]}>
					<View style={styles.jellifyLogo}>
						<Image
							source={{
								uri: 'https://raw.githubusercontent.com/Jellify-Music/App/refs/heads/main/ios/Jellify/Images.xcassets/%20Jellify%20Stickers.stickerpack/Jellify%20Logo.sticker/JellifyDiscordEmojiFinal.png',
							}}
							style={styles.logoImage}
							resizeMode='contain'
						/>
					</View>
				</Animated.View>

				{/* Ground */}
				<View style={styles.ground} />

				{/* Start Instructions */}
				<Animated.View style={[styles.startOverlay, startOverlayStyle]}>
					<View style={styles.startTitleContainer}>
						<Text style={styles.startTitle}>Flappy Jellify</Text>
					</View>
					<Text style={styles.startInstructions}>Tap to Start</Text>
					<Text style={styles.startHint}>Tap to make the bird fly!</Text>
				</Animated.View>

				{/* Game Over Overlay */}
				<Animated.View style={[styles.gameOverOverlay, gameOverStyle]}>
					<View style={styles.gameOverCard}>
						<Text style={styles.gameOverTitle}>Game Over!</Text>
						<Text style={styles.finalScore}>{`Score: ${displayScore}`}</Text>
						<Text style={styles.tapToRestart}>Tap to Restart</Text>
					</View>
				</Animated.View>
			</View>
		</GestureDetector>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#4EC0CA',
	},
	sky: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: '#4EC0CA',
	},
	cloud1: {
		position: 'absolute',
		top: 120,
		left: 50,
		width: 80,
		height: 40,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		borderRadius: 20,
	},
	cloud2: {
		position: 'absolute',
		top: 220,
		right: 80,
		width: 100,
		height: 45,
		backgroundColor: 'rgba(255, 255, 255, 0.18)',
		borderRadius: 25,
	},
	cloud3: {
		position: 'absolute',
		top: 380,
		left: 120,
		width: 70,
		height: 35,
		backgroundColor: 'rgba(255, 255, 255, 0.15)',
		borderRadius: 18,
	},
	scoreContainer: {
		position: 'absolute',
		top: 80,
		alignSelf: 'center',
		zIndex: 10,
		backgroundColor: 'rgba(255, 255, 255, 0.35)',
		paddingHorizontal: 35,
		paddingVertical: 12,
		borderRadius: 25,
		minWidth: 100,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.3,
		shadowRadius: 5,
		elevation: 5,
	},
	scoreText: {
		fontSize: 30,
		fontFamily: 'Figtree-Bold',
		color: '#FFFFFF',
		textShadowColor: 'rgba(0, 0, 0, 0.5)',
		textShadowOffset: { width: 2, height: 2 },
		textShadowRadius: 5,
		textAlign: 'center',
	},
	pipeContainer: {
		position: 'absolute',
		width: PIPE_WIDTH,
		height: SCREEN_HEIGHT,
	},
	pipeTop: {
		position: 'absolute',
		top: 0,
		width: PIPE_WIDTH,
		backgroundColor: '#5DC983',
		borderWidth: 4,
		borderColor: '#3FA765',
		borderRadius: 6,
		shadowColor: '#000',
		shadowOffset: { width: 2, height: 0 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
		elevation: 3,
	},
	pipeBottom: {
		position: 'absolute',
		width: PIPE_WIDTH,
		height: SCREEN_HEIGHT,
		backgroundColor: '#5DC983',
		borderWidth: 4,
		borderColor: '#3FA765',
		borderRadius: 6,
		shadowColor: '#000',
		shadowOffset: { width: 2, height: 0 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
		elevation: 3,
	},
	bird: {
		position: 'absolute',
		left: SCREEN_WIDTH / 2 - BIRD_SIZE / 2,
		width: BIRD_SIZE,
		height: BIRD_SIZE,
		zIndex: 5,
	},
	jellifyLogo: {
		width: BIRD_SIZE,
		height: BIRD_SIZE,
		backgroundColor: '#FFFFFF',
		borderRadius: BIRD_SIZE / 2,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 3,
		borderColor: '#A855F7',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.4,
		shadowRadius: 6,
		elevation: 8,
		overflow: 'hidden',
	},
	logoImage: {
		width: BIRD_SIZE * 0.7,
		height: BIRD_SIZE * 0.7,
	},
	ground: {
		position: 'absolute',
		bottom: 0,
		width: SCREEN_WIDTH,
		height: GROUND_HEIGHT,
		backgroundColor: '#C19A6B',
		borderTopWidth: 6,
		borderTopColor: '#8B7355',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -3 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
		elevation: 5,
	},
	startOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		zIndex: 8,
		paddingHorizontal: 20,
		paddingTop: 60,
		paddingBottom: GROUND_HEIGHT + 20,
	},
	startTitleContainer: {
		height: 150,
		borderRadius: 10,
	},
	startTitle: {
		marginBottom: 30,
		marginTop: 30,
		fontSize: 30,
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
		fontFamily: 'Figtree-Bold',
		color: '#FFFFFF',
		textShadowColor: 'rgba(0, 0, 0, 0.75)',
		textShadowOffset: { width: 3, height: 3 },
		textShadowRadius: 6,
		textAlign: 'center',
		letterSpacing: 2,
	},
	startInstructions: {
		fontSize: 28,
		fontFamily: 'Figtree-SemiBold',
		color: '#FFFFFF',
		marginBottom: 15,
		textShadowColor: 'rgba(0, 0, 0, 0.5)',
		textShadowOffset: { width: 2, height: 2 },
		textShadowRadius: 4,
		textAlign: 'center',
	},
	startHint: {
		fontSize: 18,
		fontFamily: 'Figtree-Regular',
		color: '#E0E0E0',
		textAlign: 'center',
		paddingHorizontal: 40,
	},
	gameOverOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
		zIndex: 9,
	},
	gameOverCard: {
		backgroundColor: 'rgba(255, 255, 255, 0.97)',
		padding: 50,
		borderRadius: 30,
		alignItems: 'center',
		minWidth: 300,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.4,
		shadowRadius: 12,
		elevation: 10,
		borderWidth: 3,
		borderColor: '#A855F7',
	},
	gameOverTitle: {
		fontSize: 30,
		fontFamily: 'Figtree-Bold',
		color: '#A855F7',
		marginBottom: 25,
		textAlign: 'center',
	},
	finalScore: {
		fontSize: 24,
		fontFamily: 'Figtree-Bold',
		color: '#1F2937',
		marginBottom: 35,
		textAlign: 'center',
	},
	tapToRestart: {
		fontSize: 20,
		fontFamily: 'Figtree-SemiBold',
		color: '#4EC0CA',
		textAlign: 'center',
	},
})
