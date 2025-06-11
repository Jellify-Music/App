import { SafeAreaView } from 'react-native-safe-area-context'
import SettingsListGroup from './settings-list-group'
import { View, Text, Switch, Slider, XStack, YStack } from 'tamagui'
import { useSettingsContext } from '../../../providers/Settings'
import { MIN_CROSSFADE_DURATION, MAX_CROSSFADE_DURATION } from '../../../player/gapless-config'
import { Picker } from '@react-native-picker/picker'
import { useState } from 'react'
import type { FadeCurve } from '../../../player/helpers/crossfade'
import { SwitchWithLabel } from '../../Global/helpers/switch-with-label'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'

const gesture = Gesture.Pan()

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
		<SettingsListGroup
			settingsList={[
				{
					title: 'Crossfade',
					subTitle: 'Smooth transitions between tracks',
					iconName: 'transit-connection-variant',
					iconColor: '$borderColor',
					children: (
						<YStack>
							<SwitchWithLabel
								checked={crossfadeEnabled}
								onCheckedChange={setCrossfadeEnabled}
								label={crossfadeEnabled ? 'Enabled' : 'Disabled'}
								size='$2'
								width={100}
							/>
							{crossfadeEnabled && (
								<YStack space='$3' paddingLeft='$2'>
									<GestureDetector gesture={gesture}>
										{/* Duration Slider */}
										<YStack space='$2'>
											<XStack
												justifyContent='space-between'
												alignItems='center'
											>
												<Text fontSize='$4' fontWeight='500'>
													Duration
												</Text>
												<Text fontSize='$3' color='$color10'>
													{crossfadeDuration}s
												</Text>
											</XStack>
											<Slider
												value={[crossfadeDuration]}
												onValueChange={(value) =>
													setCrossfadeDuration(value[0])
												}
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
									</GestureDetector>

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
												onValueChange={(value: FadeCurve) =>
													setCrossfadeCurve(value)
												}
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
					),
				},
			]}
		/>
	)
}
