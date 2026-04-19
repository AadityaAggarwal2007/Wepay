// Database seed script
// Run: npx tsx prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create subscription plans (matching NiyopPe)
  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Basic',
        price: 1299,
        durationMonths: 1,
        features: JSON.stringify(['0% Fee', 'Realtime', 'No Limit', '24/7 Support']),
        dynamicQr: false,
        paytmButton: false,
        isPopular: false,
      },
    }),
    prisma.plan.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Enterprise',
        price: 14999,
        durationMonths: 12,
        features: JSON.stringify(['0% Fee', 'Realtime', 'No Limit', 'Dynamic QR', 'Paytm Button', '24/7 Support']),
        dynamicQr: true,
        paytmButton: true,
        isPopular: true,
      },
    }),
    prisma.plan.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'Starter',
        price: 3499,
        durationMonths: 3,
        features: JSON.stringify(['0% Fee', 'Realtime', 'No Limit', 'Dynamic QR', 'Paytm Button', '24/7 Support']),
        dynamicQr: true,
        paytmButton: true,
        isPopular: false,
      },
    }),
    prisma.plan.upsert({
      where: { id: 4 },
      update: {},
      create: {
        name: 'Business',
        price: 6999,
        durationMonths: 6,
        features: JSON.stringify(['0% Fee', 'Realtime', 'No Limit', 'Dynamic QR', 'Paytm Button', '24/7 Support']),
        dynamicQr: true,
        paytmButton: true,
        isPopular: false,
      },
    }),
  ]);

  console.log(`✅ Created ${plans.length} subscription plans`);

  // Create default admin user
  const passwordHash = await bcrypt.hash('Aaditya@4321', 12);
  const apiToken = crypto.randomBytes(16).toString('hex');

  const user = await prisma.user.upsert({
    where: { mobile: '9289144767' },
    update: {},
    create: {
      name: 'Aaditya Aggarwal',
      email: 'aadityaaggarwal3526@gmail.com',
      mobile: '9289144767',
      passwordHash,
      company: 'WePay',
      panNumber: 'ABCPR1234A',
      aadhaarNumber: '256729852104',
      location: 'New Delhi',
      instanceId: `INST${Date.now()}${Math.random().toString(36).substring(2, 10)}`,
      role: 'admin',
      apiToken,
      status: 'active',
      planId: 2, // Enterprise plan
      planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
  });

  console.log(`✅ Created admin user: ${user.name} (${user.mobile})`);
  console.log(`   API Token: ${apiToken}`);

  console.log('\n🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
