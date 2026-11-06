import type { Patron } from '../../types/patron'

/**
 * Bundled fallback for the list served by the patrons API
 */
export const SPECIAL_THANKS: Patron[] = [
	'Bill Thornton',
	'@BotBlake',
	'@Chaphasilor',
	'Erik Balchunas',
	'Lyssa VanDomelen',
	'James Harvey',
	'Niels van Velzen',
	'@PBD3D',
	'Ritesh Shukla',
	'Thalia Fields',
	'@skalthoff',
	'@skribe',
].map((fullName) => ({ fullName }))
