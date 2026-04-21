export const APP_DATA_STORAGE_KEY = 'curalyta.app-data.v1'

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

export function loadAppDataState() {
  if (!canUseStorage()) {
    return null
  }

  try {
    const saved = window.localStorage.getItem(APP_DATA_STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch (error) {
    console.warn('App data restore failed', error)
    return null
  }
}

export function saveAppDataState(state) {
  if (!canUseStorage()) {
    return
  }

  try {
    window.localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.warn('App data persist failed', error)
  }
}

export function clearAppDataState() {
  if (!canUseStorage()) {
    return
  }

  try {
    window.localStorage.removeItem(APP_DATA_STORAGE_KEY)
  } catch (error) {
    console.warn('App data clear failed', error)
  }
}
