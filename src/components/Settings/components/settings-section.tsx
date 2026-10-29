import React, { useState } from 'react'
import { YStack, XStack, SizableText, Card, Separator, ThemeTokens } from 'tamagui'
import Icon from '../../Global/components/icon'
import { MaterialDesignIconsIconName } from '@react-native-vector-icons/material-design-icons'

interface SettingsSectionProps {
	title: string
	icon: MaterialDesignIconsIconName
	iconColor?: ThemeTokens
	children: React.ReactNode
	defaultExpanded?: boolean
	collapsible?: boolean
}

export default function SettingsSection({
	title,
	icon,
	iconColor = 'borderColor',
	children,
	defaultExpanded = false,
	collapsible = true,
}: SettingsSectionProps): React.JSX.Element {
	const [expanded, setExpanded] = useState(defaultExpanded)

	const toggleExpanded = () => {
		if (collapsible) {
			setExpanded(!expanded)
		}
	}

	const showContent = !collapsible || expanded

	return (
		<Card
			borderWidth={'1'}
			borderColor='borderColor'
			backgroundColor='background'
			marginVertical='1-5'
			padding='0'
			borderRadius='4'
		>
			<XStack
				paddingHorizontal='3'
				paddingVertical='3'
				alignItems='center'
				justifyContent='space-between'
				opacity={collapsible ? { press: 0.7 } : undefined}
				onPress={collapsible ? toggleExpanded : undefined}
				hitSlop={8}
			>
				<XStack alignItems='center' gap='3' flex={1}>
					<Icon name={icon} color={iconColor} />
					<SizableText size='2' fontWeight='6'>
						{title}
					</SizableText>
				</XStack>
				{collapsible && (
					<Icon
						name={expanded ? 'chevron-up' : 'chevron-down'}
						color='borderColor'
						size='7'
					/>
				)}
			</XStack>
			{showContent && (
				<>
					<Separator borderColor='borderColor' />
					<YStack padding='3' gap='3'>
						{children}
					</YStack>
				</>
			)}
		</Card>
	)
}
