import { describe, expect, it } from 'vitest'
import {
  createSeedState,
  createBooking,
  updateBookingStatus,
  appendThreadMessage,
  updateVerificationStatus,
  updateAdminUserStatus,
  selectDoctorIncomingBookings,
  selectPatientBookings,
  selectThreadByPatientId,
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
    const createdPatientBooking = patientBookings.find(
      (booking) =>
        booking.doctorId === 'dr-003' &&
        booking.date === '2026-04-25' &&
        booking.time === '09:00' &&
        booking.chief === 'Kontrol demam anak'
    )
    const createdDoctorBooking = doctorBookings.find(
      (booking) =>
        booking.patientId === 'pt-001' &&
        booking.date === '2026-04-25' &&
        booking.time === '09:00' &&
        booking.chief === 'Kontrol demam anak'
    )

    expect(createdPatientBooking.doctorId).toBe('dr-003')
    expect(createdDoctorBooking.patientId).toBe('pt-001')
    expect(createdDoctorBooking.status).toBe('pending')
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

    const confirmed = updateBookingStatus(created, createdBooking.id, { status: 'confirmed' })

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

  it('keeps patient threads isolated when messages and admin updates are applied', () => {
    const seed = createSeedState()

    const withNewMessage = appendThreadMessage(seed, 'pt-001', {
      from: 'doctor',
      text: 'Silakan lanjutkan obat lambung selama 3 hari ke depan.',
      time: '15:10',
    })
    const withUserStatusChange = updateAdminUserStatus(withNewMessage, 'u-6', {
      status: 'active',
    })
    const next = updateVerificationStatus(withUserStatusChange, 'vr-101', {
      status: 'verified',
    })

    const rakaThread = selectThreadByPatientId(next, 'pt-001')
    const otherThread = selectThreadByPatientId(next, 'pt-002')

    expect(rakaThread.patientId).toBe('pt-001')
    expect(rakaThread.messages.at(-1)).toEqual(
      expect.objectContaining({
        from: 'doctor',
        text: 'Silakan lanjutkan obat lambung selama 3 hari ke depan.',
      })
    )
    expect(otherThread.patientId).toBe('pt-002')
    expect(
      otherThread.messages.some(
        (message) => message.text === 'Silakan lanjutkan obat lambung selama 3 hari ke depan.'
      )
    ).toBe(false)
  })

  it('records audit events for verification and user status changes', () => {
    const seed = createSeedState()

    const withUserStatusChange = updateAdminUserStatus(seed, 'u-6', {
      status: 'active',
    })
    const next = updateVerificationStatus(withUserStatusChange, 'vr-101', {
      status: 'verified',
      note: 'Dokumen STR dan SIP tervalidasi.',
    })

    const userStatusEvent = next.auditEvents.find(
      (event) => event.action === 'admin.user-status.updated' && event.entityId === 'u-6'
    )
    const verificationEvent = next.auditEvents.find(
      (event) => event.action === 'verification.status.updated' && event.entityId === 'vr-101'
    )

    expect(next.auditEvents).toHaveLength(seed.auditEvents.length + 2)
    expect(userStatusEvent).toEqual(
      expect.objectContaining({
        entityType: 'user',
        entityId: 'u-6',
        changes: expect.objectContaining({ status: 'active' }),
      })
    )
    expect(verificationEvent).toEqual(
      expect.objectContaining({
        entityType: 'verification',
        entityId: 'vr-101',
        changes: expect.objectContaining({
          status: 'verified',
          note: 'Dokumen STR dan SIP tervalidasi.',
        }),
      })
    )
  })
})
