import { createContext, ReactNode, use } from 'react'
import { StyleSheet } from 'react-native'
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
	const { PagerView, setPage } = usePagerView()

	return (
		<PlayerContext
			value={{
				setPage,
			}}
		>
			<PagerView orientation={'vertical'} scrollEnabled style={styles.pager}>
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
