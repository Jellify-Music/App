/**
 * Sleep for a given number of milliseconds
 *
 * Name inspired by the album Sleepify by Vulfpeck
 * @see https://en.wikipedia.org/wiki/Sleepify
 *
 * @param ms The number of milliseconds to sleep
 * @returns A promise that resolves after the given number of milliseconds
 */
export const sleepify = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
