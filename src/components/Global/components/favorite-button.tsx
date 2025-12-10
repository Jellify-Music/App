import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import React from 'react'
import Animated, {
	BounceIn,
	FadeIn,
	FadeOut,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from 'react-native-reanimated'
import { useAddFavorite, useRemoveFavorite } from '../../../api/mutations/favorite'
import { useIsFavorite } from '../../../api/queries/user-data'
import { Spinner, useTheme } from 'tamagui'
import { Pressable, StyleSheet } from 'react-native'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'

interface FavoriteButtonProps {
	item: BaseItemDto
	onToggle?: () => void
}

/**
 * M3 Expressive FavoriteButton
 *
 * - 44px circular container
 * - Filled with primary color when favorited
 * - Outlined with primary border when not favorited
 * - Spring scale animation on press
 */
export default function FavoriteButton({ item, onToggle }: FavoriteButtonProps): React.JSX.Element {
	const { data: isFavorite, isPending } = useIsFavorite(item)
	const theme = useTheme()
	const scale = useSharedValue(1)

	const addFavorite = useAddFavorite()
	const removeFavorite = useRemoveFavorite()

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}))

	const handlePressIn = () => {
		scale.value = withSpring(0.9, { damping: 15, stiffness: 400 })
	}

	const handlePressOut = () => {
		scale.value = withSpring(1, { damping: 15, stiffness: 400 })
	}

	const handlePress = () => {
		if (isFavorite) {
			removeFavorite.mutate({ item, onToggle })
		} else {
			addFavorite.mutate({ item, onToggle })
		}
	}

	if (isPending || addFavorite.isPending || removeFavorite.isPending) {
		return (
			<Animated.View style={[styles.container, { borderColor: theme.primary.val }]}>
				<Spinner color={theme.primary.val} size='small' />
			</Animated.View>
		)
	}

	return (
		<Animated.View
			entering={isFavorite ? BounceIn : FadeIn}
			exiting={FadeOut}
			style={animatedStyle}
		>
			<Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress}>
				<Animated.View
					style={[
						styles.container,
						isFavorite
							? { backgroundColor: theme.primary.val, borderColor: theme.primary.val }
							: { backgroundColor: 'transparent', borderColor: theme.primary.val },
					]}
				>
					<MaterialDesignIcons
						name={isFavorite ? 'heart' : 'heart-outline'}
						size={22}
						color={isFavorite ? theme.background.val : theme.primary.val}
					/>
				</Animated.View>
			</Pressable>
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	container: {
		width: 44,
		height: 44,
		borderRadius: 22,
		borderWidth: 1.5,
		alignItems: 'center',
		justifyContent: 'center',
	},
})
