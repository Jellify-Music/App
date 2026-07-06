import { createContext, ReactNode, use } from 'react'
import { Platform, StyleSheet } from 'react-native'
import { usePagerView } from 'react-native-pager-view'

interface PlayerContext {
	setPage: (page: number) => void
}

const PlayerContext = createContext<PlayerContext>({
	setPage: (page) => {},
})

interface PlayerProviderProps {
	children: ReactNode
}

export const PlayerProvider = ({ children }: PlayerProviderProps) => {
	const { PagerView, ref, setPage: setPagerViewPage } = usePagerView()

	/**
	 * Sets the page of the {@link PagerView}.
	 *
	 * For iOS, a shim is required and implemented here
	 *
	 * On Android, business as usual
	 *
	 * @see https://github.com/callstack/react-native-pager-view#known-issues
	 */
	const setPage =
		Platform.OS === 'ios'
			? (index: number) =>
					requestAnimationFrame(() => ref.current?.setPageWithoutAnimation(index))
			: setPagerViewPage

	return (
		<PlayerContext
			value={{
				setPage,
			}}
		>
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
