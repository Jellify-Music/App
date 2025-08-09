import React, { useEffect, useMemo, useRef } from 'react'
import Animated, {
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated'
import { FlatList } from 'react-native'
import { Text } from '../../Global/helpers/text'
import { ParsedLyricLine } from '../../../api/queries/lyrics'
import { YStack } from 'tamagui'

interface LyricsCardProps {
	/** Whether to show the lyrics (back) side */
	show: boolean
	/** Parsed lyric lines */
	lines: ParsedLyricLine[]
	/** Current playback position in seconds */
	progressSeconds: number
	/** Front face children (album art + info) */
	children: React.ReactNode
	/** Optional callback when active lyric index changes */
	onActiveIndex?: (i: number) => void
}

const FLIP_DURATION = 400

export default function LyricsCard({
	show,
	lines,
	progressSeconds,
	children,
	onActiveIndex,
}: LyricsCardProps) {
	const rotation = useSharedValue(0)
	const listRef = useRef<FlatList<ParsedLyricLine>>(null)

	// Determine active index
	const activeIndex = useMemo(() => {
		if (!lines.length) return -1
		// Find last line whose time <= progress
		let idx = -1
		for (let i = 0; i < lines.length; i++) {
			if (lines[i].time <= progressSeconds) idx = i
			else break
		}
		return idx
	}, [lines, progressSeconds])

	useEffect(() => {
		if (show) rotation.value = withTiming(180, { duration: FLIP_DURATION })
		else rotation.value = withTiming(0, { duration: FLIP_DURATION })
	}, [show])

	useEffect(() => {
		if (activeIndex > -1) {
			listRef.current?.scrollToIndex({ index: activeIndex, animated: true })
			onActiveIndex?.(activeIndex)
		}
	}, [activeIndex])

	const frontStyle = useAnimatedStyle(() => {
		const rotateY = `${interpolate(rotation.value, [0, 180], [0, 180])}deg`
		return {
			backfaceVisibility: 'hidden' as const,
			transform: [{ rotateY }],
			opacity: interpolate(rotation.value, [0, 90], [1, 0]),
			position: 'absolute' as const,
			width: '100%',
			height: '100%',
		}
	})

	const backStyle = useAnimatedStyle(() => {
		const rotateY = `${interpolate(rotation.value, [0, 180], [180, 360])}deg`
		return {
			backfaceVisibility: 'hidden' as const,
			transform: [{ rotateY }],
			opacity: interpolate(rotation.value, [90, 180], [0, 1]),
			position: 'absolute' as const,
			width: '100%',
			height: '100%',
		}
	})

	return (
		<YStack flex={1} justifyContent='center' alignItems='center'>
			{/* Front (album art + info) */}
			<Animated.View style={frontStyle} pointerEvents={!show ? 'auto' : 'none'}>
				{children}
			</Animated.View>
			{/* Back (lyrics) */}
			<Animated.View style={backStyle} pointerEvents={show ? 'auto' : 'none'}>
				<FlatList
					ref={listRef}
					data={lines}
					keyExtractor={(_, i) => i.toString()}
					contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 8 }}
					getItemLayout={(_, index) => ({ length: 42, offset: 42 * index, index })}
					renderItem={({ item, index }) => {
						const active = index === activeIndex
						return (
							<YStack paddingVertical={4} opacity={active ? 1 : 0.75}>
								<Text
									textAlign='center'
									fontSize={active ? '$6' : '$5'}
									bold={active}
								>
									{item.text || ' '}
								</Text>
							</YStack>
						)
					}}
					ListEmptyComponent={<Text textAlign='center'>No lyrics</Text>}
				/>
			</Animated.View>
		</YStack>
	)
}
