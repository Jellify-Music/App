import ArtistsSortByConfig from '../../configs/sorting/artist'

export type ArtistsSortBy = (typeof ArtistsSortByConfig)[keyof typeof ArtistsSortByConfig]
