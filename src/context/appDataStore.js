import { DEMO_SEED } from '../data/demoSeed'

const cloneValue = (value) => JSON.parse(JSON.stringify(value))

const toArray = (value) => (Array.isArray(value) ? value : [])

const indexById = (items) =>
  items.reduce(
    (accumulator, item) => {
      accumulator.ids.push(item.id)
      accumulator.byId[item.id] = cloneValue(item)
      return accumulator
    },
    { ids: [], byId: {} }
  )

const indexThreadsByPatientId = (threads) =>
  threads.reduce((accumulator, thread) => {
    accumulator[thread.patientId] = {
      ...cloneValue(thread),
      messages: toArray(thread.messages).map((message) => cloneValue(message)),
    }
    return accumulator
  }, {})

const getNextPrefixedNumber = (items, prefix) =>
  items.reduce((largest, item) => {
    if (!item?.id?.startsWith(prefix)) return largest
    const number = Number.parseInt(item.id.slice(prefix.length), 10)
    return Number.isFinite(number) ? Math.max(largest, number) : largest
  }, 0) + 1

const buildState = (seed) => {
  const bookings = indexById(toArray(seed.bookings))
  const verifications = indexById(toArray(seed.verifications))
  const adminUsers = indexById(toArray(seed.adminUsers))
  const doctors = indexById(toArray(seed.doctors))
  const patients = indexById(toArray(seed.patients))
  const threads = toArray(seed.threads)
  const auditEvents = toArray(seed.auditEvents).map((event) => cloneValue(event))
  const threadMessages = threads.flatMap((thread) => toArray(thread.messages))

  return {
    patientIds: patients.ids,
    patientsById: patients.byId,
    doctorIds: doctors.ids,
    doctorsById: doctors.byId,
    bookingIds: bookings.ids,
    bookingsById: bookings.byId,
    verificationIds: verifications.ids,
    verificationsById: verifications.byId,
    adminUserIds: adminUsers.ids,
    adminUsersById: adminUsers.byId,
    threadsByPatientId: indexThreadsByPatientId(threads),
    consultationHistory: toArray(seed.consultationHistory).map((item) => cloneValue(item)),
    doctorPatients: toArray(seed.doctorPatients).map((item) => cloneValue(item)),
    adminStats: cloneValue(seed.adminStats ?? {}),
    auditEvents,
    meta: {
      nextBookingNumber: getNextPrefixedNumber(toArray(seed.bookings), 'bk-'),
      nextThreadMessageNumber: getNextPrefixedNumber(threadMessages, 'msg-'),
      nextAuditEventNumber: getNextPrefixedNumber(auditEvents, 'audit-'),
    },
  }
}

const createBookingId = (value) => `bk-${String(value).padStart(3, '0')}`
const createMessageId = (value) => `msg-${String(value).padStart(3, '0')}`
const createAuditEventId = (value) => `audit-${String(value).padStart(3, '0')}`

const appendAuditEvent = (state, event) => {
  const auditEvent = {
    id: createAuditEventId(state.meta.nextAuditEventNumber),
    recordedAt: event.recordedAt ?? new Date().toISOString(),
    ...event,
  }

  return {
    ...state,
    auditEvents: [...state.auditEvents, auditEvent],
    meta: {
      ...state.meta,
      nextAuditEventNumber: state.meta.nextAuditEventNumber + 1,
    },
  }
}

export function createSeedState(seed = DEMO_SEED) {
  return buildState(seed)
}

export function createBooking(state, input) {
  const bookingId = createBookingId(state.meta.nextBookingNumber)
  const booking = {
    id: bookingId,
    status: 'pending',
    ...cloneValue(input),
  }

  return {
    ...state,
    bookingIds: [...state.bookingIds, bookingId],
    bookingsById: {
      ...state.bookingsById,
      [bookingId]: booking,
    },
    meta: {
      ...state.meta,
      nextBookingNumber: state.meta.nextBookingNumber + 1,
    },
  }
}

export function updateBookingStatus(state, bookingId, patch) {
  const currentBooking = state.bookingsById[bookingId]
  if (!currentBooking || !patch || typeof patch !== 'object') {
    return state
  }

  return {
    ...state,
    bookingsById: {
      ...state.bookingsById,
      [bookingId]: {
        ...currentBooking,
        ...cloneValue(patch),
      },
    },
  }
}

export function appendThreadMessage(state, patientId, message) {
  const currentThread = state.threadsByPatientId[patientId]
  const nextMessage = {
    id: createMessageId(state.meta.nextThreadMessageNumber),
    ...cloneValue(message),
  }

  const nextThread = currentThread
    ? {
        ...currentThread,
        time: message.time ?? currentThread.time,
        messages: [...toArray(currentThread.messages), nextMessage],
      }
    : {
        id: `th-${patientId}`,
        patientId,
        patientName: state.patientsById[patientId]?.name ?? '',
        doctorId: message.doctorId ?? null,
        doctorName: message.doctorName ?? '',
        unread: 0,
        time: message.time ?? '',
        messages: [nextMessage],
      }

  return {
    ...state,
    threadsByPatientId: {
      ...state.threadsByPatientId,
      [patientId]: nextThread,
    },
    meta: {
      ...state.meta,
      nextThreadMessageNumber: state.meta.nextThreadMessageNumber + 1,
    },
  }
}

export function updateVerificationStatus(state, verificationId, patch) {
  const currentVerification = state.verificationsById[verificationId]
  if (!currentVerification || !patch || typeof patch !== 'object') {
    return state
  }

  const nextVerification = {
    ...currentVerification,
    ...cloneValue(patch),
    ...(patch.note ? { revisionNote: patch.note } : {}),
  }

  return appendAuditEvent(
    {
      ...state,
      verificationsById: {
        ...state.verificationsById,
        [verificationId]: nextVerification,
      },
    },
    {
      action: 'verification.status.updated',
      entityType: 'verification',
      entityId: verificationId,
      changes: cloneValue(patch),
    }
  )
}

export function updateAdminUserStatus(state, userId, patch) {
  const currentUser = state.adminUsersById[userId]
  if (!currentUser || !patch || typeof patch !== 'object') {
    return state
  }

  return appendAuditEvent(
    {
      ...state,
      adminUsersById: {
        ...state.adminUsersById,
        [userId]: {
          ...currentUser,
          ...cloneValue(patch),
        },
      },
    },
    {
      action: 'admin.user-status.updated',
      entityType: 'user',
      entityId: userId,
      changes: cloneValue(patch),
    }
  )
}

export function selectPatientBookings(state, patientId) {
  return state.bookingIds
    .map((bookingId) => state.bookingsById[bookingId])
    .filter((booking) => booking?.patientId === patientId)
}

export function selectDoctorIncomingBookings(state, doctorId) {
  return state.bookingIds
    .map((bookingId) => state.bookingsById[bookingId])
    .filter((booking) => booking?.doctorId === doctorId)
}

export function selectThreadByPatientId(state, patientId) {
  return state.threadsByPatientId[patientId] ?? null
}
