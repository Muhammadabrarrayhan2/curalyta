import { describe, expect, it } from 'vitest'
import {
  createSeedState,
  createBooking,
  updateBookingStatus,
  selectDoctorIncomingBookings,
  selectPatientBookings,
} from '../appDataStore'

describe('appDataStore', () => {
  it('creates a booking that appears in both patient and doctor views', () => {
    const seed = createSeedState()

    const next = createBooking(seed, {
      patientId: 'pt-001',
      patientName: 'Raka Wijaya',
      doctorId: 'dr-003',
      doctorName: 'dr. Lestari Wahyuni, Sp.A',
      specialty: 'Anak',
      date: '2026-04-25',
      time: '09:00',
      mode: 'online',
      chief: 'Kontrol demam anak',
    })

    const patientBookings = selectPatientBookings(next, 'pt-001')
    const doctorBookings = selectDoctorIncomingBookings(next, 'dr-003')

    expect(patientBookings[0].doctorId).toBe('dr-003')
    expect(doctorBookings[0].patientId).toBe('pt-001')
    expect(doctorBookings[0].status).toBe('pending')
  })

  it('updates one canonical booking record when the doctor confirms it', () => {
    const seed = createSeedState()
    const created = createBooking(seed, {
      patientId: 'pt-001',
      patientName: 'Raka Wijaya',
      doctorId: 'dr-001',
      doctorName: 'dr. Ayu Pradipta, Sp.PD',
      specialty: 'Penyakit Dalam',
      date: '2026-04-26',
      time: '14:30',
      mode: 'offline',
      chief: 'Kontrol tekanan darah',
    })

    const createdBooking = selectPatientBookings(created, 'pt-001').find(
      (booking) =>
        booking.doctorId === 'dr-001' &&
        booking.date === '2026-04-26' &&
        booking.time === '14:30' &&
        booking.chief === 'Kontrol tekanan darah'
    )

    const confirmed = updateBookingStatus(created, createdBooking.id, 'confirmed')

    const confirmedPatientBooking = selectPatientBookings(confirmed, 'pt-001').find(
      (booking) =>
        booking.doctorId === 'dr-001' &&
        booking.date === '2026-04-26' &&
        booking.time === '14:30' &&
        booking.chief === 'Kontrol tekanan darah'
    )
    const confirmedDoctorBooking = selectDoctorIncomingBookings(confirmed, 'dr-001').find(
      (booking) =>
        booking.patientId === 'pt-001' &&
        booking.date === '2026-04-26' &&
        booking.time === '14:30' &&
        booking.chief === 'Kontrol tekanan darah'
    )

    expect(confirmedPatientBooking.status).toBe('confirmed')
    expect(confirmedDoctorBooking.status).toBe('confirmed')
  })
})
