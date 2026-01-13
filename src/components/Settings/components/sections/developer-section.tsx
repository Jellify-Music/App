import React, { useState } from 'react'
import { Alert } from 'react-native'
import { XStack, YStack, SizableText } from 'tamagui'

import SettingsSection from '../settings-section'
import Icon from '../../../Global/components/icon'
import Button from '../../../Global/helpers/button'
import Input from '../../../Global/helpers/input'
import { SwitchWithLabel } from '../../../Global/helpers/switch-with-label'
import { useDeveloperOptionsEnabled, usePrId } from '../../../../stores/settings/developer'
import { downloadPRUpdate } from '../../../OtaUpdates/otaPR'

export default function DeveloperSection(): React.JSX.Element {
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
		<SettingsSection title='Developer' icon='code-braces' iconColor='$borderColor'>
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
	)
}
