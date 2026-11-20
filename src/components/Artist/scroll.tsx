import React, { createContext, ReactNode, use, useEffect, useRef, useState } from 'react'
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { SharedValue, useSharedValue } from 'react-native-reanimated'
import { useIsFocused } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getTokenValue } from 'tamagui'

/** Room under the artwork for the name and the buttons that sit on its foot */
export const NAME_ROW_HEIGHT = 72

/** Height of the pills on the artist's image, and the gap around them */
export const PILL_HEIGHT = 44
const BAR_PADDING = 8

/** How far the artwork scrolls before the top bar has fully faded in */
const FADE_DISTANCE = 120

/** How tall the artist's image is: it runs up behind the status bar, and down to where the tabs start */
export const artistImageHeight = (statusBarHeight: number): number =>
	getTokenValue('14', 'size') + statusBarHeight + NAME_ROW_HEIGHT

interface ArtistScroll {
	/** How far the list on show has scrolled */
	scrollY: SharedValue<number>
	/** Whether the image has scrolled away behind the top bar */
	collapsed: boolean
	setCollapsed: (collapsed: boolean) => void
}

const ArtistScrollContext = createContext<ArtistScroll | null>(null)

export function ArtistScrollProvider({ children }: { children: ReactNode }): React.JSX.Element {
	const scrollY = useSharedValue(0)
	const [collapsed, setCollapsed] = useState(false)

	return (
		<ArtistScrollContext value={{ scrollY, collapsed, setCollapsed }}>
			{children}
		</ArtistScrollContext>
	)
}

const useArtistScrollContext = (): ArtistScroll => {
	const context = use(ArtistScrollContext)

	if (!context) throw new Error('Artist scroll is only available under an ArtistScrollProvider')

	return context
}

/** Geometry of the top bar over the artist's image */
export function useArtistTopBar() {
	const { top } = useSafeAreaInsets()

	const height = top + BAR_PADDING + PILL_HEIGHT + BAR_PADDING

	// the bar is solid once the image's foot, where the name is, has scrolled up to it
	const fullyShownAt = artistImageHeight(top) - height

	return {
		height,
		statusBarHeight: top,
		fadeFrom: fullyShownAt - FADE_DISTANCE,
		fadeTo: fullyShownAt,
	}
}

/** Whether the artist's image has scrolled away behind the top bar */
export const useArtistCollapsed = (): boolean => useArtistScrollContext().collapsed

export const useArtistScrollY = (): SharedValue<number> => useArtistScrollContext().scrollY

/**
 * For each tab's list: reports its scrolling to the top bar. Every tab has a list of its own, so
 * only the one on show is heard, and a tab that comes back reports where it was left.
 */
export function useReportArtistScroll(): (event: NativeSyntheticEvent<NativeScrollEvent>) => void {
	const { scrollY, setCollapsed } = useArtistScrollContext()
	const { fadeTo } = useArtistTopBar()

	const isFocused = useIsFocused()
	const offset = useRef(0)

	const report = (y: number) => {
		scrollY.set(y)
		setCollapsed(y >= fadeTo)
	}

	useEffect(() => {
		if (isFocused) report(offset.current)
	}, [isFocused])

	return (event) => {
		offset.current = event.nativeEvent.contentOffset.y

		if (isFocused) report(offset.current)
	}
}

/** What each tab's list needs to take part: where to report scrolling, and how much is covered at the top */
export function useArtistListScroll() {
	const onScroll = useReportArtistScroll()
	const { height } = useArtistTopBar()

	return { onScroll, scrollEventThrottle: 16, topInset: height }
}
