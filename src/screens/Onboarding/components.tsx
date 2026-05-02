import React, { useEffect } from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg'
import LinearGradient from 'react-native-linear-gradient'
import { Text, XStack, YStack, useTheme } from 'tamagui'
import Animated, {
	Easing,
	FadeInDown,
	cancelAnimation,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withSpring,
	withTiming,
} from 'react-native-reanimated'

const SPRING = { damping: 14, stiffness: 180, mass: 0.7 }
const EASE = Easing.bezier(0.2, 0.85, 0.25, 1)

export const JELLY_GRADIENT = ['#00DBB9', '#7317FF'] as const

const JELLYFISH_PATH =
	'M 132.42608,20.981312 C 118.51246,20.911283 83.233511,23.746074 56.360365,51.654305 45.796,62.625558 29.55089,83.905814 26.58811,113.29033 c -7.40294,73.42144 52.764147,103.89842 72.788054,79.38036 -36.463868,13.92446 -66.671402,-28.89748 -59.6722,-76.99187 3.473754,-23.869592 17.814027,-42.416674 28.164335,-53.036571 6.067777,-6.225821 25.589544,-24.085966 53.223751,-28.03376 40.2294,-5.747136 90.97538,13.064823 77.70773,59.122749 23.93052,-19.1854 -0.16561,-72.416675 -66.3737,-72.749926 z m 33.61844,27.660523 c -0.15637,0.873109 17.57063,4.677552 20.26801,22.43059 2.06149,13.422789 -2.18647,27.390333 -4.63596,33.964525 -4.8986,13.14736 -13.61719,27.52365 -27.22475,41.0988 -13.60757,13.57515 -27.791,22.7016 -42.0741,27.88703 -6.56165,2.38218 -20.400716,6.449 -33.757671,4.28356 -17.395471,-2.78877 -21.23873,-19.91698 -22.558854,-19.68101 -1.335432,0.23968 1.561315,20.72272 21.171639,25.99425 14.891942,4.02256 30.768266,0.18731 38.009456,-2.07186 3.62148,-1.12988 7.23511,-2.50103 10.82155,-4.11196 3.28495,3.59755 13.04938,10.79723 28.88307,3.60756 0.58109,2.54687 1.67998,5.8919 2.57742,9.75615 1.93279,11.93762 2.38159,21.49289 9.97511,31.68005 5.5257,6.03215 9.50278,13.04102 12.97768,20.37001 3.44066,7.25698 4.53197,18.68518 0.0145,28.1854 -2.77917,5.84432 5.98727,10.01289 8.76645,4.16857 5.97041,-12.55594 5.17179,-26.78287 -0.5015,-37.49929 -3.14998,-8.32268 -8.2272,-12.94231 -13.28804,-22.87489 -6.63164,-8.89346 -4.70435,-15.72057 -5.5061,-25.77123 -0.44898,-6.67531 -2.19296,-12.13481 -4.06054,-14.75266 0.19433,-0.14943 0.38902,-0.30124 0.58471,-0.45471 1.94031,2.828 5.48286,6.55225 8.99522,10.35414 7.5628,8.40093 14.55322,17.47623 18.46481,28.18628 1.518,4.63827 2.34922,9.61912 3.86468,14.68334 1.10607,3.69475 3.66449,10.51609 8.48217,15.14497 7.13321,6.86804 17.79854,8.73118 26.96605,4.73364 5.52038,-2.45974 1.90681,-10.74731 -3.65205,-8.37588 -5.2181,2.27539 -12.0543,1.54567 -16.93836,-3.04193 -3.28244,-3.09429 -5.44418,-8.22123 -6.4883,-11.17515 -1.64816,-4.66496 -2.82379,-9.69781 -4.76079,-14.66484 -3.7344,-10.0023 -9.91217,-18.14002 -19.62958,-30.68165 -3.13054,-4.28151 -6.1771,-8.57628 -8.6116,-10.99431 1.35116,-1.29249 2.77537,-2.72541 4.10849,-4.14373 1.91368,1.00791 4.53363,2.08915 7.10652,4.00276 4.82027,3.82167 8.01938,9.20222 11.40914,14.23845 10.08919,15.44711 18.1641,20.56112 23.16435,23.07769 6.45911,3.25828 13.22974,4.50847 18.15975,8.01303 3.4288,2.68495 6.28676,6.8256 7.36535,11.09888 1.39967,6.19967 10.69763,4.11044 9.31069,-2.09209 -1.94969,-6.42602 -5.77756,-12.73634 -11.22309,-16.73845 -6.30294,-4.42247 -13.52343,-5.69332 -19.43373,-8.62604 -10.31999,-5.13635 -16.42496,-15.39067 -18.9484,-19.85606 -3.34284,-6.50737 -6.64541,-13.11375 -12.00827,-18.21925 -1.78269,-1.66064 -3.39523,-2.77163 -4.84457,-3.47873 3.88041,0.45662 9.55226,0.99509 15.85042,2.96162 7.55765,3.29282 10.5626,3.71024 27.95346,22.32139 2.96137,3.83614 8.24352,8.31628 12.57159,12.51787 6.5578,6.54831 14.58539,11.59384 23.63927,13.70922 7.01883,1.65857 9.51992,-8.86135 2.50578,-10.5396 -3.75877,-0.89381 -13.19573,-3.56655 -20.73312,-9.29971 -4.14644,-3.27043 -7.80617,-7.35297 -11.01163,-11.12083 -3.20553,-3.76786 -6.69155,-8.66951 -11.25314,-13.31172 -6.05619,-5.99911 -13.20575,-10.43792 -20.5985,-13.19385 -7.71091,-2.87457 -13.18338,-3.36271 -16.65987,-2.88594 2.80508,-6.13646 6.82252,-19.22387 -3.87276,-28.95935 1.60309,-3.63734 2.92801,-7.23174 3.99583,-10.75048 2.20765,-7.27471 5.84933,-23.021753 1.71828,-37.800883 -5.09913,-18.326582 -23.61986,-22.082312 -25.4062,-21.301692 z m -42.4311,5.940061 C 110.65172,59.753012 97.989474,68.444707 86.893063,79.556601 75.796648,90.668498 66.949595,103.19833 62.007446,116.18441 53.923889,137.42491 54.944325,192.4134 113.91851,166.16575 75.517716,170.15678 68.460798,144.04326 77.97804,117.18106 81.454571,107.36863 88.179713,97.792328 96.699944,89.272088 105.2202,80.751833 114.89444,74.29118 124.60891,70.549601 159.9886,57.537934 176.68266,66.263104 173.59418,106.49009 202.03524,38.745967 138.47627,48.6523 123.61342,54.581896 Z m 17.95926,44.352112 c -8.23301,-0.24878 -18.1321,6.306662 -25.70189,14.852052 -10.09307,11.39384 -16.044796,26.32531 -8.38453,33.38155 7.66026,7.05625 22.51622,-0.78205 33.23133,-12.15734 10.71512,-11.37531 17.28889,-26.28767 8.38453,-33.38098 -2.22609,-1.773332 -4.7851,-2.612352 -7.52944,-2.695282 z'

/** Animated jellyfish logo with gentle floating motion. */
export function JellyfishMark({
	size = 92,
	gradient = JELLY_GRADIENT,
	floating = true,
}: {
	size?: number
	gradient?: readonly [string, string]
	floating?: boolean
}) {
	const float = useSharedValue(0)
	useEffect(() => {
		if (!floating) return
		float.value = withRepeat(
			withSequence(
				withTiming(1, { duration: 2000, easing: EASE }),
				withTiming(0, { duration: 2000, easing: EASE }),
			),
			-1,
			false,
		)
		return () => cancelAnimation(float)
	}, [floating])

	const style = useAnimatedStyle(() => ({
		transform: [{ translateY: -8 * float.value }, { rotate: `${-1 + 2.5 * float.value}deg` }],
	}))

	return (
		<Animated.View style={style}>
			<Svg viewBox='0 0 300 300' width={size} height={size}>
				<Defs>
					<SvgLinearGradient id='jg' x1='76.6' y1='82.7' x2='233.5' y2='239.6'>
						<Stop offset='0' stopColor={gradient[0]} />
						<Stop offset='1' stopColor={gradient[1]} />
					</SvgLinearGradient>
				</Defs>
				<Path fill='url(#jg)' d={JELLYFISH_PATH} />
			</Svg>
		</Animated.View>
	)
}

/** Looping pulse rings emanating from a center. */
export function PulseRings({ color, size = 120 }: { color: string; size?: number }) {
	return (
		<>
			{[0, 1, 2].map((i) => (
				<PulseRing key={i} color={color} size={size} delay={i * 900} />
			))}
		</>
	)
}

function PulseRing({ color, size, delay }: { color: string; size: number; delay: number }) {
	const t = useSharedValue(0)
	useEffect(() => {
		t.value = withRepeat(
			withSequence(
				withTiming(0, { duration: delay }),
				withTiming(1, { duration: 2800, easing: EASE }),
			),
			-1,
			false,
		)
		return () => cancelAnimation(t)
	}, [delay])

	const style = useAnimatedStyle(() => ({
		opacity: 0.7 * (1 - t.value),
		transform: [{ scale: 0.6 + t.value * 1.0 }],
	}))

	return (
		<Animated.View
			pointerEvents='none'
			style={[
				styles.ring,
				{
					width: size,
					height: size,
					borderRadius: size / 2,
					borderColor: color,
				},
				style,
			]}
		/>
	)
}

/** Slow drifting gradient blobs in the background, themed by primary/secondary. */
export function AmbientBlobs() {
	const theme = useTheme()
	const a = useSharedValue(0)
	const b = useSharedValue(0)
	useEffect(() => {
		a.value = withRepeat(
			withSequence(
				withTiming(1, { duration: 7000, easing: EASE }),
				withTiming(0, { duration: 7000, easing: EASE }),
			),
			-1,
			false,
		)
		b.value = withRepeat(
			withSequence(
				withTiming(1, { duration: 9000, easing: EASE }),
				withTiming(0, { duration: 9000, easing: EASE }),
			),
			-1,
			false,
		)
		return () => {
			cancelAnimation(a)
			cancelAnimation(b)
		}
	}, [])

	const styleA = useAnimatedStyle(() => ({
		transform: [
			{ translateX: -30 * a.value },
			{ translateY: 20 * a.value },
			{ scale: 1 + 0.12 * a.value },
		],
	}))
	const styleB = useAnimatedStyle(() => ({
		transform: [
			{ translateX: 40 * b.value },
			{ translateY: -30 * b.value },
			{ scale: 1 + 0.08 * b.value },
		],
	}))

	const primary = (theme.primary as unknown as { val: string })?.val ?? '#887BFF'
	const secondary = (theme.secondary as unknown as { val: string })?.val ?? '#4FC3F7'

	return (
		<YStack pointerEvents='none' position='absolute' top={0} left={0} right={0} bottom={0}>
			<Animated.View
				style={[
					{
						position: 'absolute',
						top: -120,
						right: -120,
						width: 380,
						height: 380,
						borderRadius: 190,
						opacity: 0.22,
						backgroundColor: primary,
					},
					styleA,
				]}
			/>
			<Animated.View
				style={[
					{
						position: 'absolute',
						bottom: -160,
						left: -160,
						width: 420,
						height: 420,
						borderRadius: 210,
						opacity: 0.18,
						backgroundColor: secondary,
					},
					styleB,
				]}
			/>
		</YStack>
	)
}

/** Spring-pressable button — scales down on press. */
export function PressableScale({
	onPress,
	children,
	style,
	hitSlop,
	disabled,
}: {
	onPress?: () => void
	children: React.ReactNode
	style?: StyleProp<ViewStyle>
	hitSlop?: number
	disabled?: boolean
}) {
	const scale = useSharedValue(1)
	const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
	return (
		<Pressable
			disabled={disabled}
			onPressIn={() => (scale.value = withSpring(0.96, SPRING))}
			onPressOut={() => (scale.value = withSpring(1, SPRING))}
			onPress={onPress}
			hitSlop={hitSlop}
		>
			<Animated.View style={[animStyle, style]}>{children}</Animated.View>
		</Pressable>
	)
}

/** Selectable card row — used for theme/preset/quality lists. */
export function OptionCard({
	icon,
	title,
	subtitle,
	right,
	selected,
	onPress,
	accent,
	index = 0,
}: {
	icon?: React.ReactNode
	title: string
	subtitle?: string
	right?: React.ReactNode
	selected: boolean
	onPress: () => void
	accent?: string
	index?: number
}) {
	const theme = useTheme()
	const primary = accent ?? (theme.primary as unknown as { val: string })?.val ?? '#887BFF'
	const surface = (theme.background75 as unknown as { val: string })?.val ?? '#26242C'
	const border = (theme.borderColor as unknown as { val: string })?.val ?? '#3A3744'
	const text = (theme.color as unknown as { val: string })?.val ?? '#fff'
	const sub = (theme.neutral as unknown as { val: string })?.val ?? '#A6A2BD'

	return (
		<Animated.View entering={FadeInDown.delay(60 + index * 60).duration(420)}>
			<PressableScale onPress={onPress} style={{ width: '100%' }}>
				<XStack
					alignItems='center'
					gap={'$3'}
					padding={'$3'}
					borderRadius={16}
					borderWidth={1.5}
					borderColor={selected ? primary : border}
					backgroundColor={selected ? primary + '22' : surface}
				>
					{icon !== undefined && (
						<YStack
							width={42}
							height={42}
							borderRadius={12}
							backgroundColor={selected ? primary : border + '55'}
							alignItems='center'
							justifyContent='center'
						>
							{typeof icon === 'string' ? (
								<Text fontSize={20} color={selected ? '#fff' : sub}>
									{icon}
								</Text>
							) : (
								icon
							)}
						</YStack>
					)}
					<YStack flex={1}>
						<Text fontSize={15} fontWeight={'600'} color={text}>
							{title}
						</Text>
						{subtitle ? (
							<Text fontSize={12.5} color={sub}>
								{subtitle}
							</Text>
						) : null}
					</YStack>
					{right}
					<View
						style={
							selected
								? {
										width: 22,
										height: 22,
										borderRadius: 11,
										backgroundColor: primary,
										alignItems: 'center',
										justifyContent: 'center',
									}
								: {
										width: 22,
										height: 22,
										borderRadius: 11,
										borderWidth: 1.5,
										borderColor: border,
										backgroundColor: 'transparent',
									}
						}
					>
						{selected && (
							<Svg width={11} height={11} viewBox='0 0 12 12' fill='none'>
								<Path
									d='M2.5 6.2 L5 8.5 L9.5 3.5'
									stroke='#fff'
									strokeWidth={2}
									strokeLinecap='round'
									strokeLinejoin='round'
								/>
							</Svg>
						)}
					</View>
				</XStack>
			</PressableScale>
		</Animated.View>
	)
}

/** Section eyebrow + heading + sub. */
export function StepHeader({
	eyebrow,
	title,
	sub,
}: {
	eyebrow?: string
	title: string
	sub?: string
}) {
	return (
		<YStack marginBottom={'$4'}>
			{eyebrow ? (
				<Text
					fontSize={11}
					fontWeight={'700'}
					letterSpacing={1.6}
					color={'$primary'}
					marginBottom={'$2'}
				>
					{eyebrow.toUpperCase()}
				</Text>
			) : null}
			<Text fontSize={26} lineHeight={30} fontWeight={'800'} color={'$color'}>
				{title}
			</Text>
			{sub ? (
				<Text fontSize={14} color={'$neutral'} marginTop={'$2'} lineHeight={20}>
					{sub}
				</Text>
			) : null}
		</YStack>
	)
}

/** Header progress bar — segmented bars fill as user advances. */
export function ProgressBar({ idx, total }: { idx: number; total: number }) {
	const theme = useTheme()
	const primary = (theme.primary as unknown as { val: string })?.val ?? '#887BFF'
	const border = (theme.borderColor as unknown as { val: string })?.val ?? '#3A3744'
	return (
		<XStack flex={1} gap={6}>
			{Array.from({ length: total }).map((_, i) => {
				const filled = i < idx
				return <Segment key={i} filled={filled} primary={primary} border={border} />
			})}
		</XStack>
	)
}

function Segment({
	filled,
	primary,
	border,
}: {
	filled: boolean
	primary: string
	border: string
}) {
	const w = useSharedValue(filled ? 1 : 0)
	useEffect(() => {
		w.value = withTiming(filled ? 1 : 0, { duration: 520, easing: EASE })
	}, [filled])
	const style = useAnimatedStyle(() => ({ transform: [{ scaleX: w.value }] }))
	return (
		<YStack
			flex={1}
			height={5}
			borderRadius={3}
			backgroundColor={border + '88'}
			overflow='hidden'
		>
			<Animated.View
				style={[
					{
						flex: 1,
						backgroundColor: primary,
						transformOrigin: 'left',
					},
					style,
				]}
			/>
		</YStack>
	)
}

/** Animated Switch styled like the Jellify pill. */
export function AnimatedSwitch({
	value,
	onChange,
}: {
	value: boolean
	onChange: (v: boolean) => void
}) {
	const theme = useTheme()
	const primary = (theme.primary as unknown as { val: string })?.val ?? '#887BFF'
	const border = (theme.borderColor as unknown as { val: string })?.val ?? '#3A3744'
	const x = useSharedValue(value ? 22 : 0)
	useEffect(() => {
		x.value = withSpring(value ? 22 : 0, SPRING)
	}, [value])
	const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }))
	return (
		<PressableScale onPress={() => onChange(!value)}>
			<YStack
				width={50}
				height={28}
				borderRadius={14}
				backgroundColor={value ? primary : border + '88'}
				justifyContent='center'
				paddingHorizontal={3}
			>
				<Animated.View
					style={[
						{
							width: 22,
							height: 22,
							borderRadius: 11,
							backgroundColor: '#fff',
							shadowColor: '#000',
							shadowOpacity: 0.18,
							shadowRadius: 4,
							shadowOffset: { width: 0, height: 2 },
						},
						knob,
					]}
				/>
			</YStack>
		</PressableScale>
	)
}

/** Gradient CTA — animated background shift; used for the final "Drop the beat" button. */
export function GradientCTA({
	label,
	onPress,
	colors,
}: {
	label: string
	onPress: () => void
	colors: string[]
}) {
	return (
		<PressableScale onPress={onPress} style={{ width: '100%' }}>
			<LinearGradient
				colors={colors}
				start={{ x: 0, y: 0.5 }}
				end={{ x: 1, y: 0.5 }}
				style={{
					paddingVertical: 17,
					borderRadius: 100,
					alignItems: 'center',
					shadowColor: colors[1] ?? '#000',
					shadowOpacity: 0.45,
					shadowRadius: 18,
					shadowOffset: { width: 0, height: 12 },
					elevation: 8,
				}}
			>
				<Text fontSize={16} fontWeight={'800'} color={'#fff'} letterSpacing={0.3}>
					{label}
				</Text>
			</LinearGradient>
		</PressableScale>
	)
}

/** Twinkling sparkle dot — used on the Ready screen. */
export function Sparkle({
	dx,
	dy,
	size,
	delay,
	color,
}: {
	dx: number
	dy: number
	size: number
	delay: number
	color: string
}) {
	const t = useSharedValue(0)
	useEffect(() => {
		t.value = withRepeat(
			withSequence(
				withTiming(0, { duration: delay }),
				withTiming(1, { duration: 1200, easing: EASE }),
				withTiming(0, { duration: 1200, easing: EASE }),
			),
			-1,
			false,
		)
		return () => cancelAnimation(t)
	}, [delay])
	const style = useAnimatedStyle(() => ({
		opacity: t.value,
		transform: [{ scale: 0.5 + t.value * 0.5 }],
	}))
	return (
		<Animated.View
			pointerEvents='none'
			style={[
				{
					position: 'absolute',
					left: '50%',
					top: '50%',
					marginLeft: dx - size / 2,
					marginTop: dy - size / 2,
					width: size,
					height: size,
					borderRadius: size / 2,
					backgroundColor: '#fff',
					shadowColor: color,
					shadowOpacity: 0.8,
					shadowRadius: 8,
					shadowOffset: { width: 0, height: 0 },
				},
				style,
			]}
		/>
	)
}

/** Breathing wrapper — gentle scale loop. */
export function Breathing({ children }: { children: React.ReactNode }) {
	const t = useSharedValue(0)
	useEffect(() => {
		t.value = withRepeat(
			withSequence(
				withTiming(1, { duration: 1700, easing: EASE }),
				withTiming(0, { duration: 1700, easing: EASE }),
			),
			-1,
			false,
		)
		return () => cancelAnimation(t)
	}, [])
	const style = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.06 * t.value }] }))
	return <Animated.View style={style}>{children}</Animated.View>
}

const styles = StyleSheet.create({
	ring: {
		position: 'absolute',
		borderWidth: 1.5,
	},
})
