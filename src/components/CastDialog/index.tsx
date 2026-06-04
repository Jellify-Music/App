import { FlashList, ListRenderItemInfo } from '@shopify/flash-list'
import React from 'react'
import { Device, useCastDevice, useDevices } from 'react-native-google-cast'
import CastDevice from './device'
import { Paragraph, YStack } from 'tamagui'
import Icon from '../Global/components/icon'

export default function CastDialog(): React.JSX.Element {
	const devices = useDevices()

	const currentDevice = useCastDevice()

	const renderItem = ({ item }: ListRenderItemInfo<Device>) => (
		<CastDevice device={item} isActive={currentDevice?.deviceId === item.deviceId} />
	)

	return (
		<FlashList
			contentInsetAdjustmentBehavior='automatic'
			data={devices}
			ListEmptyComponent={CastDialogNoDevices}
			renderItem={renderItem}
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
