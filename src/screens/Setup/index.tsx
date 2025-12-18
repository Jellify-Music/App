import React, { useState } from 'react'
import { YStack, useTheme } from 'tamagui'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../types'
import { WelcomeStep } from './components/WelcomeStep'
import { ThemeStep } from './components/ThemeStep'
import { AudioStep } from './components/AudioStep'
import { PrivacyStep } from './components/PrivacyStep'
import { FinishStep } from './components/FinishStep'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
	FadeIn,
	FadeOut,
	useAnimatedStyle,
	withSpring,
	withTiming,
	useSharedValue,
	useAnimatedReaction,
} from 'react-native-reanimated'
import { SetupBackground } from './components/Background'
import { ThemeProvider } from './context/ThemeContext'
import { baseScreen, setSetupCompleted } from './utils'

type Props = NativeStackScreenProps<RootStackParamList, 'Setup'>

function SetupContent({ navigation }: Props): React.JSX.Element {
	const theme = useTheme()
	const insets = useSafeAreaInsets()
	const [step, setStep] = useState(0)
	const progressWidth = useSharedValue(0)

	const nextStep = () => setStep((s) => s + 1)
	const finish = () => {
		setSetupCompleted()
		navigation.replace('Tabs', { screen: 'HomeTab' })
	}

	// Animate progress bar based on step
	useAnimatedReaction(
		() => step,
		(currentStep) => {
			const totalSteps = 5
			const progress = (currentStep / totalSteps) * 100
			progressWidth.value = withSpring(progress, {
				damping: 20,
				stiffness: 90,
			})
		},
		[step],
	)

	const progressStyle = useAnimatedStyle(() => ({
		width: `${progressWidth.value}%`,
	}))

	const renderStep = () => {
		switch (step) {
			case 0:
				return <WelcomeStep key='welcome' onNext={nextStep} />
			case 1:
				return <ThemeStep key='theme' onNext={nextStep} />
			case 2:
				return <AudioStep key='audio' onNext={nextStep} />
			case 3:
				return <PrivacyStep key='privacy' onNext={nextStep} />
			case 4:
				return <FinishStep key='finish' onFinish={finish} />
			default:
				return null
		}
	}

	const showProgress = step > 0 && step < 4

	return (
		<YStack flex={1} paddingTop={insets.top} paddingBottom={insets.bottom}>
			<SetupBackground />

			{/* Modern Progress Bar */}
			{showProgress && (
				<Animated.View
					entering={FadeIn}
					exiting={FadeOut}
					style={{
						position: 'absolute',
						top: insets.top + 20,
						left: 20,
						right: 20,
						zIndex: 10,
					}}
				>
					<YStack
						backgroundColor='rgba(255,255,255,0.1)'
						height={4}
						borderRadius={2}
						overflow='hidden'
					>
						<Animated.View
							style={[
								progressStyle,
								{
									height: '100%',
									backgroundColor: 'white',
									borderRadius: 2,
								},
							]}
						/>
					</YStack>
				</Animated.View>
			)}

			<YStack flex={1} justifyContent='center' paddingHorizontal='$4'>
				{renderStep()}
			</YStack>

			{/* Step Indicator Dots */}
			{showProgress && (
				<Animated.View
					entering={FadeIn}
					exiting={FadeOut}
					style={{
						position: 'absolute',
						bottom: insets.bottom + 30,
						left: 0,
						right: 0,
						alignItems: 'center',
					}}
				>
					<YStack
						flexDirection='row'
						gap='$3'
						backgroundColor='rgba(0,0,0,0.3)'
						paddingHorizontal='$4'
						paddingVertical='$2'
						borderRadius='$10'
						backdropFilter='blur(10px)'
					>
						{[1, 2, 3].map((i) => {
							const isActive = step === i
							const isCompleted = step > i
							return (
								<YStack
									key={i}
									width={isActive ? 24 : 8}
									height={8}
									borderRadius={4}
									backgroundColor={
										isCompleted || isActive ? '$white' : 'rgba(255,255,255,0.3)'
									}
									animation='quick'
								/>
							)
						})}
					</YStack>
				</Animated.View>
			)}
		</YStack>
	)
}

export default function Setup(props: Props): React.JSX.Element {
	return (
		<ThemeProvider>
			<SetupContent {...props} />
		</ThemeProvider>
	)
}
