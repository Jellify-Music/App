import { BaseStackParamList } from '../types'
import SearchParamList from '../Search/types'

type FavoritesStackParamList = BaseStackParamList &
	SearchParamList & {
		AddPlaylist: undefined
	}

export default FavoritesStackParamList
