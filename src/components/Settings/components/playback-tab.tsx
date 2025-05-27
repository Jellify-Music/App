import { SafeAreaView } from 'react-native-safe-area-context'
import SettingsListGroup from './settings-list-group'
import { View, Text, Switch, Slider, XStack, YStack } from 'tamagui'
import { useSettingsContext } from '../../../providers/Settings'
import { MIN_CROSSFADE_DURATION, MAX_CROSSFADE_DURATION } from '../../../player/gapless-config'
import { Picker } from '@react-native-picker/picker'
import { useState } from 'react'
import type { FadeCurve } from '../../../player/helpers/crossfade'

export default function PlaybackTab(): React.JSX.Element {
	const {
		crossfadeEnabled,
		setCrossfadeEnabled,
		crossfadeDuration,
		setCrossfadeDuration,
		crossfadeCurve,
		setCrossfadeCurve,
		autoCrossfade,
		setAutoCrossfade,
	} = useSettingsContext()

	const [showCurveOptions, setShowCurveOptions] = useState(false)

	const fadeOptions = [
		{ label: 'Linear', value: 'linear' },
		{ label: 'Logarithmic (Recommended)', value: 'logarithmic' },
		{ label: 'Exponential', value: 'exponential' },
	]

	return (
		<SafeAreaView>
			<YStack space='$4' padding='$4'>
				{/* Crossfade Toggle */}
				<XStack justifyContent='space-between' alignItems='center' paddingVertical='$2'>
					<YStack flex={1}>
						<Text fontSize='$5' fontWeight='600'>
							Crossfade
						</Text>
						<Text fontSize='$3' color='$color10'>
							Smooth transitions between tracks
						</Text>
					</YStack>
					<Switch
						checked={crossfadeEnabled}
						onCheckedChange={setCrossfadeEnabled}
						size='$4'
					/>
				</XStack>

				{crossfadeEnabled && (
					<YStack space='$3' paddingLeft='$2'>
						{/* Duration Slider */}
						<YStack space='$2'>
							<XStack justifyContent='space-between' alignItems='center'>
								<Text fontSize='$4' fontWeight='500'>
									Duration
								</Text>
								<Text fontSize='$3' color='$color10'>
									{crossfadeDuration}s
								</Text>
							</XStack>
							<Slider
								value={[crossfadeDuration]}
								onValueChange={(value) => setCrossfadeDuration(value[0])}
								min={MIN_CROSSFADE_DURATION}
								max={MAX_CROSSFADE_DURATION}
								step={0.5}
								size='$4'
							>
								<Slider.Track backgroundColor='$background'>
									<Slider.TrackActive backgroundColor='$blue10' />
								</Slider.Track>
								<Slider.Thumb
									size='$2'
									index={0}
									circular
									backgroundColor='$blue10'
								/>
							</Slider>
							<XStack justifyContent='space-between'>
								<Text fontSize='$2' color='$color9'>
									{MIN_CROSSFADE_DURATION}s
								</Text>
								<Text fontSize='$2' color='$color9'>
									{MAX_CROSSFADE_DURATION}s
								</Text>
							</XStack>
						</YStack>

						{/* Fade Curve Picker */}
						<YStack space='$2'>
							<Text fontSize='$4' fontWeight='500'>
								Fade Curve
							</Text>
							<View
								borderWidth={1}
								borderColor='$borderColor'
								borderRadius='$4'
								overflow='hidden'
								backgroundColor='$background'
							>
								<Picker
									selectedValue={crossfadeCurve}
									onValueChange={(value: FadeCurve) => setCrossfadeCurve(value)}
									style={{ height: 50 }}
								>
									{fadeOptions.map((option) => (
										<Picker.Item
											key={option.value}
											label={option.label}
											value={option.value}
										/>
									))}
								</Picker>
							</View>
							<Text fontSize='$2' color='$color9'>
								Logarithmic provides the most natural-sounding crossfade
							</Text>
						</YStack>

						{/* Auto Crossfade Toggle */}
						<XStack
							justifyContent='space-between'
							alignItems='center'
							paddingVertical='$2'
						>
							<YStack flex={1}>
								<Text fontSize='$4' fontWeight='500'>
									Auto Crossfade
								</Text>
								<Text fontSize='$3' color='$color10'>
									Automatically crossfade between consecutive tracks
								</Text>
							</YStack>
							<Switch
								checked={autoCrossfade}
								onCheckedChange={setAutoCrossfade}
								size='$3'
							/>
						</XStack>
					</YStack>
				)}
			</YStack>
		</SafeAreaView>
	)
}
