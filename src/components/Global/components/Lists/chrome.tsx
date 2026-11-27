import { createContext, use } from 'react'
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

/**
 * What a screen that draws over the top of its lists, like the artist's top bar, tells them:
 * how much of the top is covered, so sticky headers and the A-Z scroller start below it, and
 * where to report scrolling.
 */
export interface ListChrome {
	/** Height of what covers the top of the list */
	topInset: number
	onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
}

const ListChromeContext = createContext<ListChrome>({ topInset: 0 })

export const ListChromeProvider = ListChromeContext.Provider

export const useListChrome = (): ListChrome => use(ListChromeContext)
