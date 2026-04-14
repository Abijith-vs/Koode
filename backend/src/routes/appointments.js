import { randomUUID } from 'node:crypto'
import express from 'express'
import { requireAuth } from '../lib/authMiddleware.js'
import { readAppointments, writeAppointments } from '../lib/appointmentsStore.js'
import { readAuth } from '../lib/authStore.js'

export const appointmentsRouter = express.Router()

appointmentsRouter.get('/appointments/me', requireAuth(), async (req, res, next) => {
  try {
    const db = await readAppointments()
    const user = req.user
    const authDb = await readAuth()

    const appointments =
      user.role === 'doctor'
        ? db.appointments.filter((a) => a.doctorId === user.id)
        : db.appointments.filter((a) => a.patientId === user.id)

    const usersById = new Map(authDb.users.map((u) => [u.id, u]))
    const hydrated = appointments.map((a) => {
      const patient = usersById.get(a.patientId)
      const doctor = usersById.get(a.doctorId)
      return {
        ...a,
        patient: patient ? { id: patient.id, name: patient.name, email: patient.email } : null,
        doctor: doctor ? { id: doctor.id, name: doctor.name, email: doctor.email, department: doctor.department ?? '' } : null,
      }
    })

    res.json({ appointments: hydrated })
  } catch (err) {
    next(err)
  }
})

appointmentsRouter.post('/appointments', requireAuth(), async (req, res, next) => {
  try {
    const user = req.user
    if (user.role !== 'patient') return res.status(403).json({ error: 'Only patients can book appointments' })

    const { doctorId, datetime, reason } = req.body ?? {}
    if (!doctorId || !datetime) return res.status(400).json({ error: 'doctorId and datetime are required' })

    const authDb = await readAuth()
    const doctor = authDb.users.find((u) => u.id === doctorId && u.role === 'doctor')
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' })

    const db = await readAppointments()
    const appointment = {
      id: `apt_${randomUUID()}`,
      patientId: user.id,
      doctorId: doctor.id,
      department: doctor.department ?? '',
      datetime: String(datetime),
      reason: reason ? String(reason) : '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    db.appointments.unshift(appointment)
    await writeAppointments(db)
    res.status(201).json({ appointment })
  } catch (err) {
    next(err)
  }
})

appointmentsRouter.patch('/appointments/:id/status', requireAuth(), async (req, res, next) => {
  try {
    const user = req.user
    if (user.role !== 'doctor') return res.status(403).json({ error: 'Only doctors can update appointment status' })

    const { status } = req.body ?? {}
    if (!status || !['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (accepted/rejected) required' })
    }

    const aptId = String(req.params.id)
    const db = await readAppointments()
    const appointment = db.appointments.find((a) => a.id === aptId)

    if (!appointment) return res.status(404).json({ error: 'Appointment not found' })
    if (appointment.doctorId !== user.id) return res.status(403).json({ error: 'Not authorized to manage this appointment' })

    appointment.status = status
    await writeAppointments(db)
    
    // Re-hydrate with patient/doctor info before returning
    const authDb = await readAuth()
    const usersById = new Map(authDb.users.map((u) => [u.id, u]))
    const hydrated = {
      ...appointment,
      patient: usersById.has(appointment.patientId) ? { id: appointment.patientId, name: usersById.get(appointment.patientId).name, email: usersById.get(appointment.patientId).email } : null,
      doctor: usersById.has(appointment.doctorId) ? { id: appointment.doctorId, name: usersById.get(appointment.doctorId).name } : null,
    }

    res.json({ appointment: hydrated })
  } catch (err) {
    next(err)
  }
})

appointmentsRouter.patch('/appointments/:id/diagnosis', requireAuth(), async (req, res, next) => {
  try {
    const user = req.user
    if (user.role !== 'doctor') return res.status(403).json({ error: 'Only doctors can write a diagnosis' })

    const { diagnosis, followUpDate } = req.body ?? {}
    if (typeof diagnosis !== 'string') {
      return res.status(400).json({ error: 'Diagnosis text is required' })
    }

    const aptId = String(req.params.id)
    const db = await readAppointments()
    const appointment = db.appointments.find((a) => a.id === aptId)

    if (!appointment) return res.status(404).json({ error: 'Appointment not found' })
    if (appointment.doctorId !== user.id) return res.status(403).json({ error: 'Not authorized to manage this appointment' })
    if (appointment.status !== 'accepted') return res.status(400).json({ error: 'Can only diagnose accepted appointments' })

    appointment.diagnosis = diagnosis
    
    let newAppointment = null
    if (followUpDate) {
      newAppointment = {
        id: `apt_${randomUUID()}`,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        department: appointment.department,
        datetime: String(followUpDate),
        reason: 'Follow-up appointment based on previous diagnosis',
        status: 'accepted',
        createdAt: new Date().toISOString(),
      }
      db.appointments.unshift(newAppointment)
    }

    await writeAppointments(db)
    
    const authDb = await readAuth()
    const usersById = new Map(authDb.users.map((u) => [u.id, u]))
    const hydrated = {
      ...appointment,
      patient: usersById.has(appointment.patientId) ? { id: appointment.patientId, name: usersById.get(appointment.patientId).name, email: usersById.get(appointment.patientId).email } : null,
      doctor: usersById.has(appointment.doctorId) ? { id: appointment.doctorId, name: usersById.get(appointment.doctorId).name } : null,
    }
    
    let hydratedNew = null
    if (newAppointment) {
      hydratedNew = {
        ...newAppointment,
        patient: hydrated.patient,
        doctor: hydrated.doctor
      }
    }

    res.json({ appointment: hydrated, newAppointment: hydratedNew })
  } catch (err) {
    next(err)
  }
})

