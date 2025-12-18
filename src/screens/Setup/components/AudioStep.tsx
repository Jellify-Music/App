import React from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import Button from '../../../components/Global/helpers/button'
import { SwitchWithLabel } from '../../../components/Global/helpers/switch-with-label'
import Animated, {
	FadeInDown,
	FadeOutUp,
	FadeIn,
	SlideInRight,
	ZoomIn,
} from 'react-native-reanimated'
import { useStreamingQuality, useEnableAudioNormalization } from '../../../stores/settings/player'
import StreamingQuality from '../../../enums/audio-quality'
import MaterialDesignIcon from '@react-native-vector-icons/material-design-icons'
import { useTheme } from 'tamagui'

interface Props {
	onNext: () => void
}

export const AudioStep: React.FC<Props> = ({ onNext }) => {
	const [quality, setQuality] = useStreamingQuality()
	const [normalization, setNormalization] = useEnableAudioNormalization()
	const theme = useTheme()

	const isLight =
		theme.background.val === '#ffffff' || theme.background.val === 'rgb(235, 221, 255)'
	const textColor = theme.color.val
	const primaryColor = theme.primary.val

	const qualities = [
		{
			label: 'Original',
			sub: 'Lossless Quality',
			value: StreamingQuality.Original,
			icon: 'network',
		},
		{
			label: 'High',
			sub: '320kbps AAC',
			value: StreamingQuality.High,
			icon: 'network-strength-4',
		},
		{
			label: 'Medium',
			sub: '256kbps AAC',
			value: StreamingQuality.Medium,
			icon: 'network-strength-3',
		},
		{
			label: 'Low',
			sub: '128kbps AAC',
			value: StreamingQuality.Low,
			icon: 'network-strength-1',
		},
	]

	return (
		<Animated.View
			entering={FadeIn.duration(600)}
			exiting={FadeOutUp.duration(400)}
			style={styles.container}
		>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.content}>
					{/* Header */}
					<Animated.View entering={FadeInDown.delay(200).springify()}>
						<View style={styles.header}>
							<View
								style={[
									styles.iconContainer,
									{
										backgroundColor: isLight
											? 'rgba(109, 47, 255, 0.15)'
											: 'rgba(255,255,255,0.15)',
									},
								]}
							>
								<MaterialDesignIcon
									name='equalizer'
									size={40}
									color={primaryColor}
								/>
							</View>
							<Text style={[styles.subtitle, { color: textColor }]}>
								Choose your streaming quality
							</Text>
						</View>
					</Animated.View>

					{/* Quality Options */}
					<View style={styles.qualityList}>
						{qualities.map((q, index) => {
							const isSelected = quality === q.value
							return (
								<Animated.View
									key={q.value}
									entering={SlideInRight.delay(400 + index * 80).springify()}
								>
									<Pressable
										onPress={() => setQuality(q.value)}
										style={({ pressed }) => [
											styles.qualityCard,
											{
												backgroundColor: isSelected
													? isLight
														? 'rgba(109, 47, 255, 0.2)'
														: 'rgba(255,255,255,0.2)'
													: isLight
														? 'rgba(0,0,0,0.08)'
														: 'rgba(255,255,255,0.08)',
												borderColor: isSelected
													? primaryColor
													: isLight
														? 'rgba(0,0,0,0.15)'
														: 'rgba(255,255,255,0.15)',
												shadowColor: isSelected
													? primaryColor
													: 'transparent',
											},
											isSelected && styles.qualityCardSelected,
											pressed && styles.qualityCardPressed,
										]}
									>
										<View style={styles.qualityContent}>
											{/* Icon Circle */}
											<View
												style={[
													styles.qualityIcon,
													{
														backgroundColor: isSelected
															? isLight
																? 'rgba(109, 47, 255, 0.25)'
																: 'rgba(255,255,255,0.25)'
															: isLight
																? 'rgba(0,0,0,0.1)'
																: 'rgba(255,255,255,0.1)',
													},
												]}
											>
												<MaterialDesignIcon
													// eslint-disable-next-line @typescript-eslint/no-explicit-any
													name={q.icon as any}
													size={24}
													color={textColor}
													style={{ opacity: isSelected ? 1 : 0.7 }}
												/>
											</View>

											{/* Text Content */}
											<View style={styles.qualityTextContainer}>
												<Text
													style={[
														styles.qualityLabel,
														{ color: textColor },
														isSelected && styles.qualityLabelSelected,
													]}
												>
													{q.label}
												</Text>
												<Text
													style={[
														styles.qualitySub,
														{ color: textColor },
													]}
												>
													{q.sub}
												</Text>
											</View>

											{/* Check Icon */}
											{isSelected && (
												<Animated.View entering={ZoomIn.springify()}>
													<MaterialDesignIcon
														name='check-circle'
														size={24}
														color={primaryColor}
													/>
												</Animated.View>
											)}
										</View>
									</Pressable>
								</Animated.View>
							)
						})}
					</View>

					{/* Normalization Toggle */}
					<Animated.View entering={FadeInDown.delay(800).springify()}>
						<View
							style={[
								styles.toggleContainer,
								{
									backgroundColor: isLight
										? 'rgba(109, 47, 255, 0.1)'
										: 'rgba(255,255,255,0.1)',
									borderColor: isLight
										? 'rgba(109, 47, 255, 0.2)'
										: 'rgba(255,255,255,0.2)',
								},
							]}
						>
							<SwitchWithLabel
								label='Normalize Audio Volume'
								checked={normalization}
								onCheckedChange={setNormalization}
								size='$4'
							/>
							<Text style={[styles.toggleDesc, { color: textColor }]}>
								Balances volume levels across tracks
							</Text>
						</View>
					</Animated.View>

					{/* Next Button */}
					<Animated.View entering={FadeInDown.delay(900).springify()}>
						<Button
							onPress={onNext}
							size='$6'
							backgroundColor='$primary'
							color='$white'
							fontWeight='bold'
							borderRadius='$10'
							shadowColor='$primary'
							shadowRadius={20}
							shadowOpacity={0.4}
							shadowOffset={{ width: 0, height: 8 }}
						>
							CONTINUE
						</Button>
					</Animated.View>
				</View>
			</ScrollView>
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		justifyContent: 'center',
		paddingVertical: 20,
	},
	content: {
		gap: 24,
		paddingHorizontal: 20,
	},
	header: {
		gap: 12,
		alignItems: 'center',
	},
	iconContainer: {
		width: 70,
		height: 70,
		borderRadius: 35,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 8,
	},
	title: {
		fontSize: 36,
		fontWeight: 'bold',
		textAlign: 'center',
		letterSpacing: 1,
		fontFamily: 'Figtree-Black',
		textShadowColor: 'rgba(0,0,0,0.2)',
		textShadowRadius: 10,
	},
	subtitle: {
		fontSize: 16,
		opacity: 0.85,
		textAlign: 'center',
		fontFamily: 'Figtree-Medium',
	},
	qualityList: {
		gap: 12,
	},
	qualityCard: {
		borderWidth: 2,
		borderRadius: 12,
		padding: 16,
	},
	qualityCardSelected: {
		shadowRadius: 15,
		shadowOpacity: 0.25,
		shadowOffset: { width: 0, height: 6 },
	},
	qualityCardPressed: {
		transform: [{ scale: 0.97 }],
		opacity: 0.9,
	},
	qualityContent: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
	},
	qualityIcon: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: 'center',
		justifyContent: 'center',
	},
	qualityTextContainer: {
		flex: 1,
		gap: 4,
	},
	qualityLabel: {
		fontWeight: 'bold',
		fontSize: 16,
		opacity: 0.9,
		fontFamily: 'Figtree-Bold',
	},
	qualityLabelSelected: {
		opacity: 1,
	},
	qualitySub: {
		fontSize: 13,
		opacity: 0.7,
		fontFamily: 'Figtree-Regular',
	},
	toggleContainer: {
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		gap: 8,
	},
	toggleDesc: {
		fontSize: 13,
		opacity: 0.6,
		fontFamily: 'Figtree-Regular',
	},
})
