import React, { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { XStack } from 'tamagui'
import { getActiveIcon, setIcon } from 'react-native-app-icon-changer'

import { AppIconConfig, AppIconValue } from '../../../../../types/Artwork/icon'
import { APP_ICONS } from '../../../../../configs/styling/icon'
import AppIconCard from './card'
import Toast from 'react-native-toast-message'
import { applyHapticFeedback } from '../../../../../utils/haptics'
import { handleError } from '../../../../../utils/errors'
import { LoggingContext } from '../../../../../utils/logging'
import { Setting } from '../../sections'

export default function AppIconSettings(): React.JSX.Element {
	const [selected, setSelected] = useState<AppIconValue>('Default')

	useEffect(() => {
		getActiveIcon()
			.then((nativeName) => {
				const active = APP_ICONS.find((appIcon) => appIcon.nativeName === nativeName)
				if (active) setSelected(active.value)
			})
			.catch((error) => console.warn('Unable to get active app icon', error))
	}, [])

	const handleSelect = (appIcon: AppIconConfig) => {
		if (appIcon.value === selected) return

		applyHapticFeedback('info')
		const previous = selected
		setSelected(appIcon.value)

		setIcon(appIcon.nativeName)
			.then(() => {
				applyHapticFeedback('success')
				if (Platform.OS !== 'ios') {
					Toast.show({
						type: 'success',
						text1: `Updated app icon to ${appIcon.value.toLocaleLowerCase()}`,
					})
				}
			})
			.catch((error) => {
				handleError(error, LoggingContext.UI, 'Unable to set app icon')
				setSelected(previous)
			})
	}

	return (
		<Setting
			title='App Icon'
			description={
				Platform.OS === 'android'
					? 'Your new icon will appear after leaving the app'
					: undefined
			}
			orientation='vertical'
		>
			<XStack gap='2'>
				<AppIconCards selected={selected} handleSelect={handleSelect} />
			</XStack>
		</Setting>
	)
}

interface AppIconCardsProps {
	selected: AppIconValue
	handleSelect: (appIcon: AppIconConfig) => void
}

const AppIconCards = ({ selected, handleSelect }: AppIconCardsProps) =>
	APP_ICONS.map((appIcon) => (
		<AppIconCard
			key={appIcon.value}
			appIcon={appIcon}
			isSelected={selected === appIcon.value}
			onPress={() => handleSelect(appIcon)}
		/>
	))
