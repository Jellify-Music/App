import React, { useState } from 'react'
import { YStack, XStack, SizableText, Card, Separator } from 'tamagui'
import Icon from '../../Global/components/icon'
import { ThemeTokens } from 'tamagui'

interface SettingsSectionProps {
	title: string
	icon: string
	iconColor?: ThemeTokens
	children: React.ReactNode
	defaultExpanded?: boolean
	collapsible?: boolean
}

export default function SettingsSection({
	title,
	icon,
	iconColor = '$borderColor',
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
			bordered
			backgroundColor='$background'
			marginHorizontal='$3'
			marginVertical='$1.5'
			padding='$0'
		>
			<XStack
				paddingHorizontal='$3'
				paddingVertical='$3'
				alignItems='center'
				justifyContent='space-between'
				onPress={collapsible ? toggleExpanded : undefined}
				pressStyle={collapsible ? { opacity: 0.7 } : undefined}
				hitSlop={8}
			>
				<XStack alignItems='center' gap='$3' flex={1}>
					<Icon name={icon} color={iconColor} />
					<SizableText size='$5' fontWeight='600'>
						{title}
					</SizableText>
				</XStack>
				{collapsible && (
					<Icon
						name={expanded ? 'chevron-up' : 'chevron-down'}
						color='$borderColor'
						small
					/>
				)}
			</XStack>
			{showContent && (
				<>
					<Separator />
					<YStack padding='$3' gap='$3'>
						{children}
					</YStack>
				</>
			)}
		</Card>
	)
}
