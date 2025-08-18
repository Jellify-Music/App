import { BaseStackParamList } from '../types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'

type SearchParamList = BaseStackParamList & {
	SearchScreen: undefined
	Suggestions: {
		suggestions?: BaseItemDto[] | undefined
	}
}

export default SearchParamList

export type SearchSuggestionsProps = NativeStackScreenProps<SearchParamList, 'Suggestions'>
