import { createContext, ReactNode, use, useRef, useState } from 'react'
import { NativeSyntheticEvent, StyleSheet } from 'react-native'
import PagerView from 'react-native-pager-view'

interface PlayerContext {
	activePage: number
	setPage: (page: number) => void
}

const PlayerContext = createContext<PlayerContext>({
	activePage: 0,
	setPage: (page) => {},
})

interface PlayerProviderProps {
	children: ReactNode
}

export const PlayerProvider = ({ children }: PlayerProviderProps) => {
	const [activePage, setActivePage] = useState<number>(0)
	const ref = useRef<PagerView>(null)

	/**
	 * Sets the page of the {@link PagerView}.
	 *
	 * For iOS, a shim is required and implemented here
	 *
	 * On Android, business as usual
	 *
	 * @see https://github.com/callstack/react-native-pager-view#known-issues
	 */
	const setPage = (page: number) => {
		setActivePage(page)
		requestAnimationFrame(() => ref.current?.setPage(page))
	}

	const value: PlayerContext = {
		activePage,
		setPage,
	}

	const onPageSelected = (
		e: NativeSyntheticEvent<
			Readonly<{
				position: number
			}>
		>,
	) => {
		setPage(e.nativeEvent.position)
	}

	const onPageScroll = (
		e: NativeSyntheticEvent<
			Readonly<{
				position: number
				offset: number
			}>
		>,
	) => {
		if (e.nativeEvent.offset === 0) {
			setPage(e.nativeEvent.position)
		}
	}

	return (
		<PlayerContext value={value}>
			<PagerView
				orientation={'vertical'}
				ref={ref}
				scrollEnabled
				style={styles.pager}
				onPageSelected={onPageSelected}
				onPageScroll={onPageScroll}
			>
				{children}
			</PagerView>
		</PlayerContext>
	)
}

export const usePlayerContext = () => use(PlayerContext)

const styles = StyleSheet.create({
	pager: {
		flex: 1,
	},
})
