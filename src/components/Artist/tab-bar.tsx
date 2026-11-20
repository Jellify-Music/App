import React, { useEffect, useRef, useState } from 'react'
import {
	LayoutChangeEvent,
	NativeScrollEvent,
	NativeSyntheticEvent,
	ScrollView,
	StyleSheet,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { ParamListBase, useNavigation, useNavigationState } from '@react-navigation/native'
import { MaterialTopTabNavigationProp } from '@react-navigation/material-top-tabs'
import { SizableText, useTheme, View, YStack } from 'tamagui'
import { useTranslation } from 'react-i18next'
import { applyHapticFeedback } from '../../utils/haptics'
import { transparentOf } from '../../utils/color'
import Icon from '../Global/components/icon'

/** How far from either end still counts as being at it, to ignore sub-pixel rounding */
const END_TOLERANCE = 2

/**
 * The artist page's tab bar. Each tab's list starts with the header and this, so that they scroll
 * away together with the list, which is why this is drawn here rather than by the navigator.
 *
 * The tabs share the width equally while their labels fit. When they don't (a narrow screen, a long
 * translation), the bar scrolls sideways, with an arrow at whichever end has more to show.
 */
export default function ArtistTabBar(): React.JSX.Element {
	const { t } = useTranslation()

	const theme = useTheme()
	const background = theme.background.val

	const labels: Record<string, string> = {
		Discography: t('artist.tabs.discography'),
		Tracks: t('artist.tabs.tracks'),
		Playlists: t('artist.tabs.playlists'),
		Info: t('artist.tabs.info'),
	}

	const navigation = useNavigation<MaterialTopTabNavigationProp<ParamListBase>>()

	const names = useNavigationState((state) => state.routes.map((route) => route.name))
	const active = useNavigationState((state) => state.routes[state.index].name)

	const scrollRef = useRef<{ scrollTo: (options: { x: number; animated: boolean }) => void }>(
		null,
	)

	const [viewportWidth, setViewportWidth] = useState(0)
	const [contentWidth, setContentWidth] = useState(0)
	const [offset, setOffset] = useState(0)

	// where each tab sits in the scrolled content, to bring the active one into view
	const tabLayouts = useRef<Record<string, { x: number; width: number }>>({})
	const scrolledTo = useRef<string | undefined>(undefined)

	const canScrollBack = offset > END_TOLERANCE
	const canScrollForward = offset + viewportWidth < contentWidth - END_TOLERANCE

	const scrollToActive = () => {
		const layout = tabLayouts.current[active]

		// each tab's list has its own bar, so one that has just appeared starts at the left edge
		if (!layout || viewportWidth === 0 || scrolledTo.current === active) return

		scrolledTo.current = active

		const centred = layout.x - (viewportWidth - layout.width) / 2
		const furthest = Math.max(contentWidth - viewportWidth, 0)

		scrollRef.current?.scrollTo({
			x: Math.min(Math.max(centred, 0), furthest),
			animated: false,
		})
	}

	useEffect(scrollToActive, [active, viewportWidth, contentWidth])

	const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) =>
		setOffset(event.nativeEvent.contentOffset.x)

	return (
		<View>
			<ScrollView
				ref={(node) => {
					scrollRef.current = node
				}}
				horizontal
				showsHorizontalScrollIndicator={false}
				onLayout={(event: LayoutChangeEvent) =>
					setViewportWidth(event.nativeEvent.layout.width)
				}
				onContentSizeChange={(width) => setContentWidth(width)}
				onScroll={onScroll}
				scrollEventThrottle={16}
				// the tabs stretch to fill the bar when there is room to spare
				contentContainerStyle={styles.content}
				role='tablist'
			>
				{names.map((name) => (
					<YStack
						key={name}
						flexGrow={1}
						alignItems='center'
						justifyContent='center'
						// equal shares while every label fits its share, as wide as it needs to be otherwise
						minWidth={viewportWidth > 0 ? viewportWidth / names.length : undefined}
						paddingHorizontal='$3'
						paddingVertical='$3'
						borderBottomWidth={4}
						borderBottomColor={name === active ? '$primary' : 'transparent'}
						testID={`artist-${name.toLowerCase()}-tab-button`}
						role='tab'
						aria-selected={name === active}
						onLayout={(event: LayoutChangeEvent) => {
							const { x, width } = event.nativeEvent.layout
							tabLayouts.current[name] = { x, width }
							if (name === active) scrollToActive()
						}}
						onPress={() => {
							if (name === active) return

							applyHapticFeedback('info')
							navigation.navigate(name)
						}}
					>
						<SizableText
							fontSize={14}
							numberOfLines={1}
							style={{ fontFamily: 'Figtree-Bold' }}
							color={name === active ? '$primary' : '$borderColor'}
						>
							{labels[name] ?? name}
						</SizableText>
					</YStack>
				))}
			</ScrollView>

			{canScrollBack ? (
				<EdgeArrow side='left' background={background} onPress={() => scrollBy(-1)} />
			) : null}

			{canScrollForward ? (
				<EdgeArrow side='right' background={background} onPress={() => scrollBy(1)} />
			) : null}
		</View>
	)

	/** Moves a screen's width less a little, the way a page-sized nudge reads best */
	function scrollBy(direction: 1 | -1) {
		const step = viewportWidth * 0.6
		const target = Math.min(
			Math.max(offset + direction * step, 0),
			Math.max(contentWidth - viewportWidth, 0),
		)

		scrollRef.current?.scrollTo({ x: target, animated: true })
	}
}

/** An arrow over one end of the bar, on a fade so the label under it doesn't fight it */
function EdgeArrow({
	side,
	background,
	onPress,
}: {
	side: 'left' | 'right'
	background: string
	onPress: () => void
}): React.JSX.Element {
	const fade = [background, transparentOf(background)]

	return (
		<View
			position='absolute'
			top={0}
			bottom={0}
			left={side === 'left' ? 0 : undefined}
			right={side === 'right' ? 0 : undefined}
			width={44}
			justifyContent='center'
			alignItems={side === 'left' ? 'flex-start' : 'flex-end'}
			onPress={onPress}
			testID={`artist-tabs-scroll-${side}`}
		>
			<LinearGradient
				colors={side === 'left' ? fade : [...fade].reverse()}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 0 }}
				style={StyleSheet.absoluteFill}
				pointerEvents='none'
			/>

			<Icon
				name={side === 'left' ? 'chevron-left' : 'chevron-right'}
				size='6'
				color='primary'
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	content: {
		flexGrow: 1,
	},
})
