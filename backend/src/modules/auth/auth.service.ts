import bcrypt from 'bcryptjs';
import { UserRole, Gender } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { config } from '../../config';
import {
  UnauthorizedError,
  ConflictError,
  ValidationError,
  NotFoundError,
} from '../../lib/errors';
import { signToken } from '../../middleware/auth';
import type {
  LoginInput,
  RegisterPatientInput,
  RegisterDoctorInput,
} from './auth.schema';

function genderFromCode(g: Gender): Gender {
  return g;
}

function sanitizeUser(user: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string | null;
  active: boolean;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    active: user.active,
    createdAt: user.createdAt,
  };
}

export const authService = {
  async login(input: LoginInput, meta: { ip?: string; userAgent?: string } = {}) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) throw new UnauthorizedError('Email atau password salah');
    if (!user.active) throw new UnauthorizedError('Akun dinonaktifkan. Hubungi administrator.');

    if (input.role && user.role !== input.role) {
      throw new UnauthorizedError(
        `Akun ini terdaftar sebagai ${user.role.toLowerCase()}, bukan ${input.role.toLowerCase()}`
      );
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Email atau password salah');

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = signToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'login',
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    });

    return { user: sanitizeUser(user), token };
  },

  async registerPatient(input: RegisterPatientInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) throw new ConflictError('Email sudah terdaftar');

    const dob = new Date(input.dateOfBirth);
    if (isNaN(dob.getTime()) || dob > new Date()) {
      throw new ValidationError('Tanggal lahir tidak valid');
    }

    const passwordHash = await bcrypt.hash(input.password, config.auth.bcryptRounds);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: UserRole.PATIENT,
        name: input.name,
        phone: input.phone,
        lastLoginAt: new Date(),
        patient: {
          create: {
            name: input.name,
            dateOfBirth: dob,
            gender: genderFromCode(input.gender),
            address: input.address || null,
            bloodType: input.bloodType || null,
            allergies: input.allergies || null,
            chronicConditions: input.chronicConditions || null,
            emergencyContact: input.emergencyContact || null,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: { userId: user.id, action: 'register', metadata: { role: 'PATIENT' } },
    });

    const token = signToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    return { user: sanitizeUser(user), token };
  },

  async registerDoctor(input: RegisterDoctorInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existingUser) throw new ConflictError('Email sudah terdaftar');

    const existingLicense = await prisma.doctor.findUnique({
      where: { licenseNumber: input.licenseNumber },
    });
    if (existingLicense) throw new ConflictError('Nomor STR sudah terdaftar');

    const passwordHash = await bcrypt.hash(input.password, config.auth.bcryptRounds);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: UserRole.DOCTOR,
        name: input.name,
        phone: input.phone,
        doctor: {
          create: {
            specialization: input.specialization,
            licenseNumber: input.licenseNumber,
            sipNumber: input.sipNumber || null,
            experience: input.experience,
            institution: input.institution,
            bio: input.bio || null,
            schedule: input.schedule || null,
          },
        },
      },
    });

    // Notify all admins about new doctor registration
    const admins = await prisma.user.findMany({
      where: { role: UserRole.ADMIN, active: true },
      select: { id: true },
    });

    if (admins.length) {
      await prisma.notification.createMany({
        data: admins.map((a: { id: string }) => ({
          userId: a.id,
          type: 'VERIFICATION',
          title: 'Pendaftaran dokter baru',
          message: `${input.name} (${input.specialization}) menunggu verifikasi.`,
          link: '/admin/verifications',
        })),
      });
    }

    await prisma.auditLog.create({
      data: { userId: user.id, action: 'register', metadata: { role: 'DOCTOR' } },
    });

    return sanitizeUser(user);
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        doctor: true,
        patient: true,
      },
    });
    if (!user) throw new NotFoundError('User tidak ditemukan');

    return {
      ...sanitizeUser(user),
      doctor: user.doctor,
      patient: user.patient,
    };
  },

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError();

    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Password lama salah');

    const passwordHash = await bcrypt.hash(newPassword, config.auth.bcryptRounds);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await prisma.auditLog.create({
      data: { userId, action: 'password_change' },
    });
  },
};
