import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs'

type ArtistTabList = {
	ArtistAlbums: undefined
	ArtistEps: undefined
	ArtistFeaturedOn: undefined
	SimilarArtists: undefined
}

export default ArtistTabList

export type ArtistAlbumsProps = MaterialTopTabBarProps<ArtistTabList>
export type ArtistEpsProps = MaterialTopTabBarProps<ArtistTabList>
export type ArtistFeaturedOnProps = MaterialTopTabBarProps<ArtistTabList>
