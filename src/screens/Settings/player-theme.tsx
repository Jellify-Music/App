import React, { useState, useEffect } from 'react'
import { YStack, XStack, SizableText, ScrollView, Card, Spinner } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useWindowDimensions } from 'react-native'
import Icon from '../../components/Global/components/icon'
import { usePlayerTheme, PlayerThemeId } from '../../stores/settings/player-theme'
import { THEME_METADATA, themeRegistry } from '../../components/Player/themes'
import type { PlayerThemeComponent } from '../../components/Player/themes/types'

export default function PlayerThemeScreen(): React.JSX.Element {
	const { bottom } = useSafeAreaInsets()
	const { width } = useWindowDimensions()
	const [playerTheme, setPlayerTheme] = usePlayerTheme()

	// Preview dimensions (scaled down for two columns)
	const previewWidth = (width - 48) / 2
	const previewHeight = previewWidth * 1.6

	const themeIds = Object.keys(THEME_METADATA) as PlayerThemeId[]

	return (
		<YStack flex={1} backgroundColor='$background'>
			<ScrollView
				contentContainerStyle={{ paddingBottom: Math.max(bottom, 16) + 16 }}
				showsVerticalScrollIndicator={false}
			>
				<YStack padding='$4' gap='$6'>
					<YStack gap='$2'>
						<SizableText size='$4' fontWeight='600' color='$borderColor'>
							Player Style
						</SizableText>
						<SizableText size='$2' color='$borderColor'>
							Choose how the full-screen player looks
						</SizableText>
					</YStack>

					<XStack flexWrap='wrap' gap='$3' justifyContent='space-between'>
						{themeIds.map((themeId) => (
							<ThemePreviewCard
								key={themeId}
								themeId={themeId}
								isSelected={playerTheme === themeId}
								onSelect={() => setPlayerTheme(themeId)}
								previewWidth={previewWidth}
								previewHeight={previewHeight}
							/>
						))}
					</XStack>
				</YStack>
			</ScrollView>
		</YStack>
	)
}

interface ThemePreviewCardProps {
	themeId: PlayerThemeId
	isSelected: boolean
	onSelect: () => void
	previewWidth: number
	previewHeight: number
}

function ThemePreviewCard({
	themeId,
	isSelected,
	onSelect,
	previewWidth,
	previewHeight,
}: ThemePreviewCardProps): React.JSX.Element {
	const [PreviewComponent, setPreviewComponent] = useState<React.ComponentType<{
		width: number
		height: number
	}> | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const metadata = THEME_METADATA[themeId]

	useEffect(() => {
		themeRegistry
			.getTheme(themeId)
			.then((theme: PlayerThemeComponent) => setPreviewComponent(() => theme.Preview))
			.catch(console.error)
			.finally(() => setIsLoading(false))
	}, [themeId])

	return (
		<Card
			onPress={onSelect}
			pressStyle={{ scale: 0.97 }}
			animation='quick'
			borderWidth='$1'
			borderColor={isSelected ? '$primary' : '$borderColor'}
			backgroundColor={isSelected ? '$background25' : '$background'}
			borderRadius='$4'
			overflow='hidden'
			width={previewWidth}
		>
			{/* Preview area */}
			<YStack
				height={previewHeight}
				backgroundColor='$background50'
				justifyContent='center'
				alignItems='center'
			>
				{isLoading ? (
					<Spinner color='$primary' />
				) : PreviewComponent ? (
					<PreviewComponent width={previewWidth - 8} height={previewHeight - 8} />
				) : null}
			</YStack>

			{/* Info area */}
			<YStack padding='$2' gap='$1'>
				<XStack alignItems='center' gap='$2'>
					<Icon small name={metadata.icon} color={isSelected ? '$primary' : '$color'} />
					<SizableText size='$3' fontWeight='600' flex={1}>
						{metadata.name}
					</SizableText>
					{metadata.experimental && (
						<SizableText size='$1' color='$warning'>
							BETA
						</SizableText>
					)}
					{isSelected && <Icon small name='check-circle' color='$primary' />}
				</XStack>
				<SizableText size='$2' color='$borderColor' numberOfLines={2}>
					{metadata.description}
				</SizableText>
			</YStack>
		</Card>
	)
}
