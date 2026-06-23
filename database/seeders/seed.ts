import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  // Clear existing data (in reverse order of dependencies)
  await prisma.review.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.deviceToken.deleteMany({});
  await prisma.otp.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.worker.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.admin.deleteMany({});

  const passwordHash = await bcrypt.hash('admin123', 10);

  // 1. Seed Admin
  await prisma.admin.create({
    data: {
      name: 'Super Admin',
      email: 'admin@crewora.com',
      passwordHash,
      role: 'super_admin',
    },
  });

  // 2. Seed Customers
  const customerRahul = await prisma.customer.create({
    data: {
      name: 'Rahul Sharma',
      phone: '9876543210',
      address: 'Andheri West, Mumbai, Maharashtra',
      latitude: 19.1364,
      longitude: 72.8296,
      isVerified: true,
    },
  });

  await prisma.customer.create({
    data: {
      name: 'Priya Patel',
      phone: '8765432109',
      address: 'Navrangpura, Ahmedabad, Gujarat',
      latitude: 23.0321,
      longitude: 72.5580,
      isVerified: true,
    },
  });

  // 3. Seed Workers
  await prisma.worker.create({
    data: {
      name: 'Rajesh Kumar',
      phone: '7654321098',
      tradeCategories: ['carpenter'],
      bio: 'Certified Master Carpenter specialized in custom furniture, cabinetry, framing, and premium wood finishing.',
      experienceYears: 8,
      city: 'Mumbai',
      serviceRadius: 20,
      latitude: 19.1364,
      longitude: 72.8296,
      profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
      availability: 'available',
      verificationStatus: 'approved',
    },
  });

  await prisma.worker.create({
    data: {
      name: 'Vikram Singh',
      phone: '6543210987',
      tradeCategories: ['electrician', 'hvac'],
      bio: 'Master Electrician specialized in smart home installations and commercial wiring upgrades.',
      experienceYears: 10,
      city: 'Ahmedabad',
      serviceRadius: 15,
      latitude: 23.0321,
      longitude: 72.5580,
      profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
      availability: 'available',
      verificationStatus: 'approved',
    },
  });

  // 4. Seed Job
  await prisma.job.create({
    data: {
      customerId: customerRahul.id,
      title: 'Wooden Cabinet Repair',
      description: 'Need help fixing a broken cabinet door and sanding the wooden surfaces in the kitchen.',
      tradeCategory: 'carpenter',
      address: 'Andheri West, Mumbai, Maharashtra',
      latitude: 19.1364,
      longitude: 72.8296,
      urgency: 'asap',
      status: 'open',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
