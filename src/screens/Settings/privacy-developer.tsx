import React, { useState } from 'react'
import { Alert } from 'react-native'
import { YStack, XStack, SizableText, ScrollView, Separator } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import Icon from '../../components/Global/components/icon'
import Button from '../../components/Global/utils/button'
import Input from '../../components/Global/utils/input'
import { SwitchWithLabel } from '../../components/Global/utils/switch-with-label'
import { Setting } from '../../components/Settings/components/sections'
import { useReducedHapticsSetting } from '../../stores/settings/app'
import { useDeveloperOptionsEnabled, usePrId } from '../../stores/settings/developer'
import { downloadPRUpdate } from '../../services/ota/pull-request'
import SendMetricsAndCrashDataSetting from '../../components/Settings/components/settings/send-metrics-and-crash-data'
import { applyHapticFeedback } from '../../utils/haptics'

export default function PrivacyDeveloperScreen(): React.JSX.Element {
	const { bottom } = useSafeAreaInsets()

	const [reducedHaptics, setReducedHaptics] = useReducedHapticsSetting()

	const [developerOptionsEnabled, setDeveloperOptionsEnabled] = useDeveloperOptionsEnabled()
	const [prId, setPrId] = usePrId()
	const [localPrId, setLocalPrId] = useState(prId)

	const handleSubmitPr = () => {
		applyHapticFeedback('info')
		const trimmed = localPrId.trim()
		const parsed = Number(trimmed)
		if (!trimmed || !Number.isInteger(parsed) || parsed <= 0) {
			Alert.alert('Error', 'Please enter a valid PR ID (a positive integer)')
			return
		}
		setPrId(trimmed)
		downloadPRUpdate(parsed)
	}

	return (
		<ScrollView
			contentContainerStyle={{ paddingBottom: Math.max(bottom, 16) + 16 }}
			showsVerticalScrollIndicator={false}
			testID='settings-screen-privacy-developer'
			gap='2'
		>
			<SendMetricsAndCrashDataSetting />

			<Separator borderColor='borderColor' />

			<Setting
				title='Reduce Haptics'
				description='Reduce haptic feedback intensity'
				orientation='horizontal'
			>
				<SwitchWithLabel
					checked={reducedHaptics}
					onCheckedChange={setReducedHaptics}
					size='2'
				/>
			</Setting>

			<Separator borderColor='borderColor' />

			<Setting
				title='Developer Options'
				description='Enable advanced developer features'
				orientation='horizontal'
			>
				<SwitchWithLabel
					testID='developer-options-switch'
					checked={developerOptionsEnabled}
					onCheckedChange={setDeveloperOptionsEnabled}
					size='2'
				/>
			</Setting>

			{developerOptionsEnabled && (
				<>
					<Separator borderColor='borderColor' />

					<Setting
						title='Pull Request Build'
						description='Enter PR ID to test pull request builds'
						orientation='vertical'
					>
						<YStack gap='2'>
							<XStack gap='2' alignItems='center'>
								<Input
									placeholder='Enter PR ID'
									value={localPrId}
									onChangeText={setLocalPrId}
									keyboardType='numeric'
									flex={1}
								/>
								<Button
									circular
									backgroundColor='primary'
									onPress={handleSubmitPr}
									icon={<Icon name='check' color='background' size='7' />}
								/>
							</XStack>
							{prId && (
								<SizableText color='success' fontSize='2'>
									Current PR ID: {prId}
								</SizableText>
							)}
						</YStack>
					</Setting>
				</>
			)}
		</ScrollView>
	)
}
