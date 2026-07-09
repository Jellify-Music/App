import { createContext, ReactNode, use } from 'react'
import { Platform, StyleSheet } from 'react-native'
import { usePagerView } from 'react-native-pager-view'

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
	const { PagerView, activePage, ref, setPage: setPagerViewPage } = usePagerView()

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
		if (Platform.OS === 'ios') {
			requestAnimationFrame(() => ref.current?.setPage(page))
		} else {
			setPagerViewPage(page)
		}
	}

	const value: PlayerContext = {
		activePage,
		setPage,
	}

	return (
		<PlayerContext value={value}>
			<PagerView orientation={'vertical'} ref={ref} scrollEnabled style={styles.pager}>
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
