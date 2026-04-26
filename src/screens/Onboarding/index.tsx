import React, { useState } from 'react'
import { Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated'
import { Text, XStack, YStack, useTheme } from 'tamagui'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Icon from '../../components/Global/components/icon'
import { useApi, useJellifyLibrary } from '../../stores'
import type { RootStackParamList } from '../types'
import {
	useColorPresetSetting,
	useEnableOtaUpdatesSetting,
	useOnboardingCompleted,
	useThemeSetting,
} from '../../stores/settings/app'
import { useStreamingQuality } from '../../stores/settings/player'
import { useDownloadQuality } from '../../stores/settings/usage'
import { AmbientBlobs, PressableScale, ProgressBar } from './components'
import { StepDownload, StepOTA, StepReady, StepStreaming, StepTheme, StepWelcome } from './steps'

const QUESTION_STEPS = 4 // theme, streaming, ota, download

/**
 * Jellify Onboarding — 6 screens (welcome, theme, streaming, OTA, download, ready)
 * with Reanimated page transitions and ambient gradient backdrop.
 *
 * Persists selections directly to existing settings stores. Marks
 * `onboardingCompleted` true when finished, so the gate in `screens/index.tsx`
 * stops mounting it on subsequent launches.
 */
export default function Onboarding(): React.JSX.Element {
	const [step, setStep] = useState(0)
	const [direction, setDirection] = useState<'forward' | 'back'>('forward')

	const [theme, setTheme] = useThemeSetting()
	const [preset, setPreset] = useColorPresetSetting()
	const [streaming, setStreaming] = useStreamingQuality()
	const [download, setDownload] = useDownloadQuality()
	const [ota, setOta] = useEnableOtaUpdatesSetting()
	const [, setOnboardingCompleted] = useOnboardingCompleted()
	const api = useApi()
	const [library] = useJellifyLibrary()
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const tamagui = useTheme()
	const primary = (tamagui.primary as unknown as { val: string })?.val ?? '#887BFF'

	const next = () => {
		setDirection('forward')
		setStep((s) => Math.min(s + 1, 5))
	}
	const back = () => {
		setDirection('back')
		setStep((s) => Math.max(s - 1, 0))
	}
	const skipToReady = () => {
		setDirection('forward')
		setStep(5)
	}
	const finish = () => {
		setOnboardingCompleted(true)
		navigation.reset({
			index: 0,
			routes: [{ name: api && library ? 'Tabs' : 'Login' }],
		})
	}

	const showHeader = step > 0
	const showFooter = step > 0 && step < 5

	const renderContent = () => {
		switch (step) {
			case 0:
				return <StepWelcome onNext={next} />
			case 1:
				return (
					<StepTheme
						mode={theme}
						preset={preset}
						onChangeMode={setTheme}
						onChangePreset={setPreset}
					/>
				)
			case 2:
				return <StepStreaming value={streaming} onChange={setStreaming} />
			case 3:
				return <StepOTA value={ota} onChange={setOta} />
			case 4:
				return (
					<StepDownload
						value={download}
						streamingValue={streaming}
						onChange={setDownload}
					/>
				)
			case 5:
				return (
					<StepReady
						settings={{
							theme,
							preset,
							streaming,
							download,
							ota,
						}}
						onFinish={finish}
					/>
				)
			default:
				return null
		}
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
			<YStack flex={1} backgroundColor={'$background'}>
				<AmbientBlobs />

				{showHeader && (
					<XStack
						paddingHorizontal={'$4'}
						paddingTop={'$2'}
						alignItems='center'
						gap={'$3'}
						zIndex={2}
					>
						<PressableScale onPress={back}>
							<YStack
								width={38}
								height={38}
								borderRadius={12}
								borderWidth={1}
								borderColor={'$borderColor'}
								backgroundColor={'$background75'}
								alignItems='center'
								justifyContent='center'
							>
								<Icon name='chevron-left' xsmall color={'$color'} />
							</YStack>
						</PressableScale>
						{step < 5 ? (
							<ProgressBar idx={step} total={QUESTION_STEPS} />
						) : (
							<Text flex={1} fontSize={13} fontWeight={'600'} color={'$neutral'}>
								Review settings
							</Text>
						)}
						{step < 5 && (
							<Pressable onPress={skipToReady} hitSlop={12}>
								<Text fontSize={13} fontWeight={'600'} color={'$neutral'}>
									Skip
								</Text>
							</Pressable>
						)}
					</XStack>
				)}

				<YStack flex={1} overflow='hidden'>
					<Animated.View
						key={step}
						entering={
							direction === 'forward'
								? SlideInRight.duration(420)
								: SlideInRight.duration(420)
						}
						exiting={
							direction === 'forward'
								? SlideOutLeft.duration(220)
								: SlideOutLeft.duration(220)
						}
						style={{ flex: 1 }}
					>
						{renderContent()}
					</Animated.View>
				</YStack>

				{showFooter && (
					<Animated.View
						key={`footer-${step}`}
						entering={FadeIn.duration(280)}
						exiting={FadeOut.duration(160)}
						style={{
							paddingHorizontal: 20,
							paddingBottom: 20,
							paddingTop: 12,
						}}
					>
						<PressableScale onPress={next} style={{ width: '100%' }}>
							<YStack
								paddingVertical={'$3.5'}
								borderRadius={100}
								backgroundColor={'$primary'}
								alignItems='center'
								style={{
									shadowColor: primary,
									shadowOpacity: 0.55,
									shadowRadius: 18,
									shadowOffset: { width: 0, height: 14 },
									elevation: 8,
								}}
							>
								<Text
									fontSize={15}
									fontWeight={'700'}
									color={'#fff'}
									letterSpacing={0.3}
								>
									{step === 4 ? 'Almost done →' : 'Continue →'}
								</Text>
							</YStack>
						</PressableScale>
					</Animated.View>
				)}
			</YStack>
		</SafeAreaView>
	)
}
