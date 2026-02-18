import React, { useState } from 'react'
import { Alert } from 'react-native'
import { YStack, XStack, SizableText, ScrollView } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import Icon from '../../components/Global/components/icon'
import Button from '../../components/Global/helpers/button'
import Input from '../../components/Global/helpers/input'
import { SwitchWithLabel } from '../../components/Global/helpers/switch-with-label'
import SettingsSection from '../../components/Settings/components/settings-section'
import { useReducedHapticsSetting, useSendMetricsSetting } from '../../stores/settings/app'
import { useDeveloperOptionsEnabled, usePrId } from '../../stores/settings/developer'
import { downloadPRUpdate } from '../../components/OtaUpdates/otaPR'

export default function PrivacyDeveloperScreen(): React.JSX.Element {
	const { bottom } = useSafeAreaInsets()

	const [sendMetrics, setSendMetrics] = useSendMetricsSetting()
	const [reducedHaptics, setReducedHaptics] = useReducedHapticsSetting()

	const [developerOptionsEnabled, setDeveloperOptionsEnabled] = useDeveloperOptionsEnabled()
	const [prId, setPrId] = usePrId()
	const [localPrId, setLocalPrId] = useState(prId)

	const handleSubmitPr = () => {
		if (localPrId.trim()) {
			setPrId(localPrId.trim())
			downloadPRUpdate(Number(localPrId.trim()))
		} else {
			Alert.alert('Error', 'Please enter a valid PR ID')
		}
	}

	return (
		<YStack flex={1} backgroundColor='$background'>
			<ScrollView
				contentContainerStyle={{ paddingBottom: Math.max(bottom, 16) + 16 }}
				showsVerticalScrollIndicator={false}
			>
				<SettingsSection
					title='Privacy'
					icon='shield-account'
					iconColor='$success'
					defaultExpanded
					collapsible={false}
				>
					<XStack alignItems='center' justifyContent='space-between'>
						<YStack flex={1}>
							<SizableText size='$4'>Send Analytics</SizableText>
							<SizableText size='$2' color='$borderColor'>
								Send usage and crash data
							</SizableText>
						</YStack>
						<SwitchWithLabel
							checked={sendMetrics}
							onCheckedChange={setSendMetrics}
							size='$2'
							label=''
						/>
					</XStack>

					<XStack alignItems='center' justifyContent='space-between'>
						<YStack flex={1}>
							<SizableText size='$4'>Reduce Haptics</SizableText>
							<SizableText size='$2' color='$borderColor'>
								Reduce haptic feedback intensity
							</SizableText>
						</YStack>
						<SwitchWithLabel
							checked={reducedHaptics}
							onCheckedChange={setReducedHaptics}
							size='$2'
							label=''
						/>
					</XStack>
				</SettingsSection>

				<SettingsSection
					title='Developer'
					icon='code-braces'
					iconColor='$borderColor'
					defaultExpanded
					collapsible={false}
				>
					<XStack alignItems='center' justifyContent='space-between'>
						<YStack flex={1}>
							<SizableText size='$4'>Developer Options</SizableText>
							<SizableText size='$2' color='$borderColor'>
								Enable advanced developer features
							</SizableText>
						</YStack>
						<SwitchWithLabel
							checked={developerOptionsEnabled}
							onCheckedChange={setDeveloperOptionsEnabled}
							size='$2'
							label=''
						/>
					</XStack>

					{developerOptionsEnabled && (
						<YStack gap='$2' paddingTop='$1'>
							<SizableText size='$2' color='$borderColor'>
								Enter PR ID to test pull request builds
							</SizableText>
							<XStack gap='$2' alignItems='center'>
								<Input
									flex={1}
									placeholder='Enter PR ID'
									value={localPrId}
									onChangeText={setLocalPrId}
									keyboardType='numeric'
									size='$3'
								/>
								<Button
									size='$3'
									backgroundColor='$primary'
									color='$background'
									onPress={handleSubmitPr}
									circular
									icon={<Icon name='check' color='$background' small />}
								/>
							</XStack>
							{prId && (
								<SizableText color='$success' size='$2'>
									Current PR ID: {prId}
								</SizableText>
							)}
						</YStack>
					)}
				</SettingsSection>
			</ScrollView>
		</YStack>
	)
}
