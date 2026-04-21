import { createContext, useContext, useEffect, useState } from 'react'
import {
  appendThreadMessage as appendThreadMessageInStore,
  createBooking as createBookingInStore,
  createSeedState,
  selectDoctorIncomingBookings as selectDoctorIncomingBookingsInStore,
  selectPatientBookings as selectPatientBookingsInStore,
  selectThreadByPatientId as selectThreadByPatientIdInStore,
  updateAdminUserStatus as updateAdminUserStatusInStore,
  updateBookingStatus as updateBookingStatusInStore,
  updateVerificationStatus as updateVerificationStatusInStore,
} from './appDataStore'
import { clearAppDataState, loadAppDataState, saveAppDataState } from '../lib/appDataStorage'

const AppDataContext = createContext(null)

export function AppDataProvider({ children, initialState = null }) {
  const [state, setState] = useState(() => initialState ?? loadAppDataState() ?? createSeedState())

  useEffect(() => {
    saveAppDataState(state)
  }, [state])

  const value = {
    state,
    setState,
    resetAppData() {
      const nextState = createSeedState()
      clearAppDataState()
      setState(nextState)
    },
    createBooking(input) {
      setState((currentState) => createBookingInStore(currentState, input))
    },
    updateBookingStatus(bookingId, patch) {
      setState((currentState) => updateBookingStatusInStore(currentState, bookingId, patch))
    },
    appendThreadMessage(patientId, message) {
      setState((currentState) => appendThreadMessageInStore(currentState, patientId, message))
    },
    updateVerificationStatus(verificationId, patch) {
      setState((currentState) => updateVerificationStatusInStore(currentState, verificationId, patch))
    },
    updateAdminUserStatus(userId, patch) {
      setState((currentState) => updateAdminUserStatusInStore(currentState, userId, patch))
    },
    selectPatientBookings(patientId) {
      return selectPatientBookingsInStore(state, patientId)
    },
    selectDoctorIncomingBookings(doctorId) {
      return selectDoctorIncomingBookingsInStore(state, doctorId)
    },
    selectThreadByPatientId(patientId) {
      return selectThreadByPatientIdInStore(state, patientId)
    },
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export { AppDataContext }

export function useAppData() {
  const context = useContext(AppDataContext)
  if (!context) {
    throw new Error('useAppData must be used inside <AppDataProvider>')
  }

  return context
}
