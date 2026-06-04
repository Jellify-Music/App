import { FlashList } from '@shopify/flash-list'
import React from 'react'
import { useDevices } from 'react-native-google-cast'
import CastDevice from './device'
import { Paragraph, YStack } from 'tamagui'
import Icon from '../Global/components/icon'

export default function CastDialog(): React.JSX.Element {
	const devices = useDevices()

	return (
		<FlashList
			contentInsetAdjustmentBehavior='automatic'
			data={devices}
			ListEmptyComponent={CastDialogNoDevices}
			renderItem={CastDevice}
		/>
	)
}

function CastDialogNoDevices() {
	return (
		<YStack>
			<Icon large name='speaker-off' />
			<Paragraph>No Cast devices discovered</Paragraph>
		</YStack>
	)
}
