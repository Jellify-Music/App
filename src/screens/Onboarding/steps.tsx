import React from 'react'
import { ScrollView } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { Text, XStack, YStack, useTheme } from 'tamagui'
import StreamingQuality from '../../enums/audio-quality'
import {
	AnimatedSwitch,
	Breathing,
	GradientCTA,
	JELLY_GRADIENT,
	JellyfishMark,
	OptionCard,
	PressableScale,
	PulseRings,
	Sparkle,
	StepHeader,
} from './components'
import type { ColorPreset, ThemeSetting } from '../../stores/settings/app'

const themeIcons: Record<ThemeSetting, string> = {
	system: '◐',
	light: '☀',
	dark: '☾',
	oled: '●',
}

const THEME_META: { id: ThemeSetting; name: string; desc: string }[] = [
	{ id: 'system', name: 'Match Device', desc: 'Follows your system' },
	{ id: 'light', name: 'Light', desc: 'Clean & bright' },
	{ id: 'dark', name: 'Dark', desc: 'Easy on the eyes' },
	{ id: 'oled', name: 'OLED Black', desc: 'Deepest black, longest battery' },
]

export const PRESET_META: {
	id: ColorPreset
	name: string
	vibe: string
	swatch: [string, string]
}[] = [
	{ id: 'purple', name: 'Purple', vibe: 'You crazy diamond', swatch: ['#887BFF', '#4b0fd6'] },
	{ id: 'ocean', name: 'Ocean', vibe: 'Deep & breezy', swatch: ['#4FC3F7', '#0288D1'] },
	{ id: 'forest', name: 'Forest', vibe: 'Acoustic & earthy', swatch: ['#9CCC65', '#0E8F15'] },
	{ id: 'sunset', name: 'Sunset', vibe: 'Warm vinyl evenings', swatch: ['#FFAB91', '#FF5722'] },
	{ id: 'peanut', name: 'Peanut', vibe: 'Roasted, mellow tones', swatch: ['#A1887F', '#aa5125'] },
]

const QUALITY_META: {
	id: StreamingQuality
	label: string
	kbps: string
	desc: string
	icon: string
}[] = [
	{
		id: StreamingQuality.Low,
		label: 'Low',
		kbps: '128 kbps',
		desc: 'Save data — perfect for cellular',
		icon: '📶',
	},
	{
		id: StreamingQuality.Medium,
		label: 'Medium',
		kbps: '256 kbps',
		desc: 'Balanced quality and bandwidth',
		icon: '📡',
	},
	{
		id: StreamingQuality.High,
		label: 'High',
		kbps: '320 kbps',
		desc: 'Crisp playback on any speakers',
		icon: '🎧',
	},
	{
		id: StreamingQuality.Original,
		label: 'Original',
		kbps: 'Lossless',
		desc: 'Untouched — bit-for-bit from source',
		icon: '💎',
	},
]

export { THEME_META, QUALITY_META }

// ─── Step 0: Welcome ────────────────────────────────────
export function StepWelcome({ onNext }: { onNext: () => void }) {
	const theme = useTheme()
	const primary = (theme.primary as unknown as { val: string })?.val ?? '#887BFF'
	return (
		<YStack flex={1} alignItems='center' justifyContent='center' padding={'$6'}>
			<YStack width={120} height={120} alignItems='center' justifyContent='center'>
				<PulseRings color={primary} size={120} />
				<JellyfishMark size={92} />
			</YStack>
			<Animated.View entering={FadeInDown.delay(120).duration(520)}>
				<Text
					fontSize={32}
					fontWeight={'800'}
					textAlign='center'
					marginTop={'$5'}
					color={'$color'}
				>
					Welcome to{' '}
					<Text fontSize={32} fontWeight={'800'} color={primary}>
						Jellify
					</Text>
				</Text>
			</Animated.View>
			<Animated.View entering={FadeInDown.delay(260).duration(520)}>
				<Text
					textAlign='center'
					marginTop={'$3'}
					fontSize={15}
					color={'$neutral'}
					maxWidth={300}
					lineHeight={22}
				>
					The Jellyfin music client that actually feels like a music app. Let&apos;s get
					you tuned up.
				</Text>
			</Animated.View>
			<Animated.View
				entering={FadeInDown.delay(420).duration(520)}
				style={{ marginTop: 36, width: '100%', alignItems: 'center' }}
			>
				<PressableScale onPress={onNext}>
					<YStack
						paddingHorizontal={'$8'}
						paddingVertical={'$3'}
						borderRadius={100}
						backgroundColor={'$primary'}
						style={{
							shadowColor: primary,
							shadowOpacity: 0.55,
							shadowRadius: 18,
							shadowOffset: { width: 0, height: 14 },
							elevation: 8,
						}}
					>
						<Text fontSize={15} fontWeight={'700'} color={'#fff'} letterSpacing={0.3}>
							Let&apos;s jellify ✨
						</Text>
					</YStack>
				</PressableScale>
			</Animated.View>
		</YStack>
	)
}

// ─── Step 1: Theme & preset ─────────────────────────────
export function StepTheme({
	mode,
	preset,
	onChangeMode,
	onChangePreset,
}: {
	mode: ThemeSetting
	preset: ColorPreset
	onChangeMode: (m: ThemeSetting) => void
	onChangePreset: (p: ColorPreset) => void
}) {
	return (
		<ScrollView
			contentContainerStyle={{ padding: 22, paddingBottom: 120 }}
			showsVerticalScrollIndicator={false}
		>
			<StepHeader
				eyebrow='01 · Look & feel'
				title='Pick your vibe'
				sub='Choose how Jellify should look. You can change it any time in Settings.'
			/>
			<Text fontSize={12.5} fontWeight={'700'} color={'$neutral'} marginBottom={'$2'}>
				THEME
			</Text>
			<YStack gap={'$2'}>
				{THEME_META.map((t, i) => (
					<OptionCard
						key={t.id}
						icon={themeIcons[t.id]}
						title={t.name}
						subtitle={t.desc}
						selected={mode === t.id}
						onPress={() => onChangeMode(t.id)}
						index={i}
					/>
				))}
			</YStack>

			<Text
				fontSize={12.5}
				fontWeight={'700'}
				color={'$neutral'}
				marginTop={'$5'}
				marginBottom={'$2'}
			>
				COLOR PRESET
			</Text>
			<YStack gap={'$2'}>
				{PRESET_META.map((p, i) => (
					<OptionCard
						key={p.id}
						icon={
							<LinearGradient
								colors={p.swatch}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={{ width: 22, height: 22, borderRadius: 11 }}
							/>
						}
						title={p.name}
						subtitle={p.vibe}
						selected={preset === p.id}
						onPress={() => onChangePreset(p.id)}
						accent={p.swatch[1]}
						index={i + 4}
					/>
				))}
			</YStack>
		</ScrollView>
	)
}

// ─── Step 2: Streaming Quality ──────────────────────────
export function StepStreaming({
	value,
	onChange,
}: {
	value: StreamingQuality
	onChange: (q: StreamingQuality) => void
}) {
	const theme = useTheme()
	const primary = (theme.primary as unknown as { val: string })?.val ?? '#887BFF'
	const border = (theme.borderColor as unknown as { val: string })?.val ?? '#3A3744'
	const idx = QUALITY_META.findIndex((q) => q.id === value)
	const current = QUALITY_META[idx]

	return (
		<ScrollView
			contentContainerStyle={{ padding: 22, paddingBottom: 120 }}
			showsVerticalScrollIndicator={false}
		>
			<StepHeader
				eyebrow='02 · Sound'
				title='How should it stream?'
				sub='Pick a default for online listening. Affects new tracks only.'
			/>

			<YStack
				backgroundColor={'$background75'}
				borderRadius={20}
				borderWidth={1}
				borderColor={'$borderColor'}
				padding={'$4'}
				marginBottom={'$4'}
				gap={'$3'}
			>
				<XStack alignItems='flex-end' justifyContent='center' gap={10} height={64}>
					{QUALITY_META.map((q, i) => {
						const active = i === idx
						const isUnder = i <= idx
						return (
							<YStack
								key={q.id}
								width={22}
								height={20 + i * 14}
								borderRadius={6}
								backgroundColor={
									isUnder ? (active ? primary : primary + '99') : border + '55'
								}
								style={{
									transform: [
										{ translateY: active ? -3 : 0 },
										{ scale: active ? 1.06 : 1 },
									],
									shadowColor: primary,
									shadowOpacity: active ? 0.5 : 0,
									shadowRadius: 8,
									shadowOffset: { width: 0, height: 4 },
								}}
							/>
						)
					})}
				</XStack>
				<Text textAlign='center' fontSize={13} color={'$neutral'}>
					Currently:{' '}
					<Text fontWeight={'700'} color={'$color'}>
						{current?.label} · {current?.kbps}
					</Text>
				</Text>
			</YStack>

			<YStack gap={'$2'}>
				{QUALITY_META.map((q, i) => (
					<OptionCard
						key={q.id}
						icon={q.icon}
						title={`${q.label} · ${q.kbps}`}
						subtitle={q.desc}
						selected={value === q.id}
						onPress={() => onChange(q.id)}
						index={i}
					/>
				))}
			</YStack>
		</ScrollView>
	)
}

// ─── Step 3: OTA Updates ────────────────────────────────
export function StepOTA({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
	const theme = useTheme()
	const primary = (theme.primary as unknown as { val: string })?.val ?? '#887BFF'
	const success = (theme.success as unknown as { val: string })?.val ?? '#57E9C9'
	return (
		<ScrollView
			contentContainerStyle={{ padding: 22, paddingBottom: 120 }}
			showsVerticalScrollIndicator={false}
		>
			<StepHeader
				eyebrow='03 · Updates'
				title='Stay on the bleeding edge?'
				sub='Jellify ships fast. OTA updates pull the latest JS bundle without waiting for the app store.'
			/>

			<PressableScale onPress={() => onChange(!value)} style={{ width: '100%' }}>
				<YStack
					backgroundColor={value ? primary + '26' : '$background75'}
					borderWidth={1.5}
					borderColor={value ? '$primary' : '$borderColor'}
					borderRadius={22}
					padding={'$4'}
					gap={'$4'}
				>
					<XStack alignItems='center' gap={'$3'}>
						<YStack
							width={56}
							height={56}
							borderRadius={16}
							backgroundColor={value ? '$primary' : '$background'}
							alignItems='center'
							justifyContent='center'
							style={{
								transform: [
									{ rotate: value ? '-8deg' : '0deg' },
									{ scale: value ? 1.05 : 1 },
								],
								shadowColor: primary,
								shadowOpacity: value ? 0.55 : 0,
								shadowRadius: 14,
								shadowOffset: { width: 0, height: 10 },
							}}
						>
							<Text fontSize={26}>☁︎</Text>
						</YStack>
						<YStack flex={1}>
							<Text fontSize={17} fontWeight={'800'} color={'$color'}>
								OTA updates
							</Text>
							<Text fontSize={13} color={'$neutral'} marginTop={2}>
								{value
									? 'Enabled — checking on launch'
									: 'Off — only manual updates'}
							</Text>
						</YStack>
						<AnimatedSwitch value={value} onChange={onChange} />
					</XStack>

					{value ? (
						<Animated.View entering={FadeIn.duration(320)}>
							<YStack
								borderTopWidth={1}
								borderTopColor={'$borderColor'}
								paddingTop={'$3'}
								gap={'$2'}
							>
								<Bullet color={success}>
									Pulls signed JS bundles from Jellify&apos;s repo
								</Bullet>
								<Bullet color={success}>
									Restart prompt — never auto-applies mid-session
								</Bullet>
								<Bullet color={success}>
									Native code still updates via the store
								</Bullet>
							</YStack>
						</Animated.View>
					) : null}
				</YStack>
			</PressableScale>

			<YStack
				marginTop={'$3'}
				padding={'$3'}
				borderRadius={12}
				backgroundColor={'$background75'}
				borderWidth={1}
				borderColor={'$borderColor'}
				borderStyle='dashed'
			>
				<Text fontSize={12.5} color={'$neutral'} lineHeight={18}>
					<Text fontWeight={'700'} color={'$color'}>
						Tip:{' '}
					</Text>
					You can opt into PR previews later from Settings → About to test unreleased
					features.
				</Text>
			</YStack>
		</ScrollView>
	)
}

function Bullet({ children, color }: { children: React.ReactNode; color: string }) {
	return (
		<XStack gap={'$2'} alignItems='flex-start'>
			<YStack
				width={16}
				height={16}
				borderRadius={8}
				backgroundColor={color}
				marginTop={2}
				alignItems='center'
				justifyContent='center'
			>
				<Text fontSize={10} color={'#fff'} fontWeight={'900'}>
					✓
				</Text>
			</YStack>
			<Text flex={1} fontSize={13} color={'$color'} lineHeight={18}>
				{children}
			</Text>
		</XStack>
	)
}

// ─── Step 4: Download Quality ───────────────────────────
const STORAGE_GB: Record<StreamingQuality, string> = {
	[StreamingQuality.Low]: '1.0 GB',
	[StreamingQuality.Medium]: '1.8 GB',
	[StreamingQuality.High]: '2.4 GB',
	[StreamingQuality.Original]: '8.0 GB',
}

const STORAGE_PCT: Record<StreamingQuality, number> = {
	[StreamingQuality.Low]: 12,
	[StreamingQuality.Medium]: 22,
	[StreamingQuality.High]: 30,
	[StreamingQuality.Original]: 100,
}

export function StepDownload({
	value,
	streamingValue,
	onChange,
}: {
	value: StreamingQuality
	streamingValue: StreamingQuality
	onChange: (q: StreamingQuality) => void
}) {
	const theme = useTheme()
	const primary = (theme.primary as unknown as { val: string })?.val ?? '#887BFF'
	const secondary = (theme.secondary as unknown as { val: string })?.val ?? '#4FC3F7'
	return (
		<ScrollView
			contentContainerStyle={{ padding: 22, paddingBottom: 120 }}
			showsVerticalScrollIndicator={false}
		>
			<StepHeader
				eyebrow='04 · Offline'
				title='Download quality'
				sub='Used when saving tracks for offline. Storage matters — pick wisely.'
			/>

			<YStack
				backgroundColor={'$background75'}
				borderRadius={20}
				borderWidth={1}
				borderColor={'$borderColor'}
				padding={'$4'}
				marginBottom={'$4'}
				gap={'$3'}
			>
				<XStack alignItems='baseline' justifyContent='space-between'>
					<Text fontSize={13} color={'$neutral'} fontWeight={'600'}>
						~1000 tracks ≈
					</Text>
					<Text fontSize={22} fontWeight={'800'} color={'$color'}>
						{STORAGE_GB[value]}
					</Text>
				</XStack>
				<YStack
					height={8}
					borderRadius={4}
					backgroundColor={'$borderColor'}
					overflow='hidden'
				>
					<Animated.View key={value} entering={FadeIn.duration(360)} style={{ flex: 1 }}>
						<LinearGradient
							colors={[primary, secondary]}
							start={{ x: 0, y: 0.5 }}
							end={{ x: 1, y: 0.5 }}
							style={{
								height: '100%',
								width: `${STORAGE_PCT[value]}%`,
								borderRadius: 4,
							}}
						/>
					</Animated.View>
				</YStack>
			</YStack>

			<YStack gap={'$2'}>
				{QUALITY_META.map((q, i) => (
					<OptionCard
						key={q.id}
						icon={q.icon}
						title={`${q.label} · ${q.kbps}`}
						subtitle={q.desc}
						selected={value === q.id}
						onPress={() => onChange(q.id)}
						index={i}
						right={
							q.id === streamingValue ? (
								<YStack
									paddingHorizontal={'$2'}
									paddingVertical={'$1'}
									borderRadius={100}
									backgroundColor={primary + '33'}
								>
									<Text fontSize={10} fontWeight={'700'} color={'$primary'}>
										SAME AS STREAM
									</Text>
								</YStack>
							) : undefined
						}
					/>
				))}
			</YStack>
		</ScrollView>
	)
}

// ─── Step 5: Ready ──────────────────────────────────────
export function StepReady({
	settings,
	onFinish,
}: {
	settings: {
		theme: ThemeSetting
		preset: ColorPreset
		streaming: StreamingQuality
		download: StreamingQuality
		ota: boolean
	}
	onFinish: () => void
}) {
	const theme = useTheme()
	const primary = (theme.primary as unknown as { val: string })?.val ?? '#887BFF'
	const presetMeta = PRESET_META.find((p) => p.id === settings.preset)
	const tmode = THEME_META.find((t) => t.id === settings.theme)
	const sq = QUALITY_META.find((q) => q.id === settings.streaming)
	const dq = QUALITY_META.find((q) => q.id === settings.download)

	return (
		<YStack flex={1} padding={'$5'}>
			<YStack flex={1} alignItems='center' justifyContent='center'>
				<YStack
					width={140}
					height={140}
					alignItems='center'
					justifyContent='center'
					marginBottom={'$4'}
				>
					<Sparkle dx={-50} dy={-30} size={8} delay={0} color={primary} />
					<Sparkle dx={60} dy={-10} size={6} delay={400} color={primary} />
					<Sparkle dx={-30} dy={50} size={7} delay={800} color={primary} />
					<Sparkle dx={55} dy={46} size={5} delay={1200} color={primary} />
					<Sparkle dx={-68} dy={20} size={4} delay={1600} color={primary} />
					<Breathing>
						<JellyfishMark size={108} />
					</Breathing>
				</YStack>
				<Animated.View entering={FadeInDown.delay(120).duration(520)}>
					<Text fontSize={34} fontWeight={'800'} color={'$color'} textAlign='center'>
						Ready to{' '}
						<Text fontSize={34} fontWeight={'800'} color={primary}>
							jellify
						</Text>
						.
					</Text>
				</Animated.View>
				<Animated.View entering={FadeInDown.delay(260).duration(520)}>
					<Text marginTop={'$2'} fontSize={14} color={'$neutral'} textAlign='center'>
						Your sound, dialed in.
					</Text>
				</Animated.View>

				<Animated.View entering={FadeInDown.delay(400).duration(520)}>
					<XStack
						flexWrap='wrap'
						gap={'$2'}
						marginTop={'$5'}
						justifyContent='center'
						maxWidth={320}
					>
						<Chip
							label={`${presetMeta?.name} · ${tmode?.name}`}
							dotColor={presetMeta?.swatch[1]}
						/>
						<Chip label={`Stream ${sq?.label}`} />
						<Chip label={settings.ota ? 'OTA on' : 'OTA off'} />
						<Chip label={`Download ${dq?.label}`} />
					</XStack>
				</Animated.View>
			</YStack>

			<Animated.View entering={FadeInDown.delay(580).duration(520)}>
				<GradientCTA
					label='Drop the beat 🪼'
					onPress={onFinish}
					colors={[JELLY_GRADIENT[0], primary, JELLY_GRADIENT[1]]}
				/>
			</Animated.View>
		</YStack>
	)
}

function Chip({ label, dotColor }: { label: string; dotColor?: string }) {
	return (
		<XStack
			paddingHorizontal={'$3'}
			paddingVertical={'$1.5'}
			borderRadius={100}
			backgroundColor={'$background75'}
			borderWidth={1}
			borderColor={'$borderColor'}
			alignItems='center'
			gap={'$1.5'}
		>
			{dotColor ? (
				<YStack width={8} height={8} borderRadius={4} backgroundColor={dotColor} />
			) : null}
			<Text fontSize={12} fontWeight={'600'} color={'$color'}>
				{label}
			</Text>
		</XStack>
	)
}
