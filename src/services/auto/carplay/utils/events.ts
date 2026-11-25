import i18n from '../../../../i18n'
import { CarPlayListItem, CarPlayListTemplate } from 'react-native-nitro-player'
import { RETRY_ID, titles } from '../constants'

export const message = (title: string): CarPlayListItem => ({ id: `message:${title}`, title })

export const retry = (): CarPlayListItem => ({
	id: RETRY_ID,
	title: i18n.t('car.unreachable'),
	subtitle: i18n.t('car.tapToRetry'),
	image: 'arrow.clockwise',
})

export const problem = (error: { response?: { status?: number } } | undefined) =>
	error?.response?.status === 401 ? message(i18n.t('car.signInAgain')) : retry()

export function opens(id: string, title: string): CarPlayListTemplate {
	titles.set(id, title)
	return { type: 'list', id, title, lazy: true }
}
