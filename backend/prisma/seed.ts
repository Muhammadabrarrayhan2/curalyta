/**
 * Prisma seed — HANYA membuat default admin account.
 * Tidak ada mock/demo data. Platform siap menerima data real.
 */
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding default administrator account...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@curalyta.app';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Curalyta#2025';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log(`✓ Admin account already exists: ${adminEmail}`);
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
      name: 'Administrator',
      emailVerified: true,
      active: true,
    },
  });

  console.log('✓ Default administrator created');
  console.log('');
  console.log('  Email:    ' + adminEmail);
  console.log('  Password: ' + adminPassword);
  console.log('');
  console.log('⚠  IMPORTANT: Change this password immediately after first login.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
