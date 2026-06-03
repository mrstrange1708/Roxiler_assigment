import { PrismaClient, Role } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Clean existing data in dependency order
  await prisma.rating.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin123!', salt);
  const ownerPassword = await bcrypt.hash('Owner123!', salt);
  const userPassword = await bcrypt.hash('User123!', salt);

  // 1. Seed System Admin (Name >= 20 chars)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@rateit.com',
      password: adminPassword,
      name: 'System Administrator Superuser', // 30 chars
      address: '123 Admin Headquarters Street, Suite 500, New York, NY 10001',
      role: Role.ADMIN,
    },
  });
  console.log('Admin user seeded:', admin.email);

  // 2. Seed Store Owner 1 & Store 1
  const owner1 = await prisma.user.create({
    data: {
      email: 'owner1@store.com',
      password: ownerPassword,
      name: 'Owner of ElectroWorld Electronics', // 33 chars
      address: '456 Tech Park Avenue, Silicon Valley, CA 94025',
      role: Role.STORE_OWNER,
    },
  });

  const store1 = await prisma.store.create({
    data: {
      name: 'ElectroWorld Electronics Store', // 30 chars
      email: 'contact@electroworld.com',
      address: '456 Tech Park Avenue, Silicon Valley, CA 94025',
      ownerId: owner1.id,
    },
  });
  console.log('Store 1 and Owner 1 seeded:', store1.name);

  // 3. Seed Store Owner 2 & Store 2
  const owner2 = await prisma.user.create({
    data: {
      email: 'owner2@store.com',
      password: ownerPassword,
      name: 'Owner of BookHaven Bookstore', // 29 chars
      address: '789 Library Square Road, Boston, MA 02108',
      role: Role.STORE_OWNER,
    },
  });

  const store2 = await prisma.store.create({
    data: {
      name: 'BookHaven Literary Bookstore', // 28 chars
      email: 'contact@bookhaven.com',
      address: '789 Library Square Road, Boston, MA 02108',
      ownerId: owner2.id,
    },
  });
  console.log('Store 2 and Owner 2 seeded:', store2.name);

  // 4. Seed Normal Users
  const user1 = await prisma.user.create({
    data: {
      email: 'user1@gmail.com',
      password: userPassword,
      name: 'Johnathan Doe Harrison Junior', // 29 chars
      address: '111 Birch Street, Apartment 4B, San Francisco, CA 94102',
      role: Role.USER,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'user2@gmail.com',
      password: userPassword,
      name: 'Elizabeth Samantha Smith Johnson', // 32 chars
      address: '222 Maple Avenue, Suite 100, Chicago, IL 60601',
      role: Role.USER,
    },
  });
  console.log('Normal users seeded:', user1.email, user2.email);

  // 5. Seed Initial Ratings
  await prisma.rating.create({
    data: {
      rating: 4,
      userId: user1.id,
      storeId: store1.id,
    },
  });

  await prisma.rating.create({
    data: {
      rating: 5,
      userId: user2.id,
      storeId: store1.id,
    },
  });

  await prisma.rating.create({
    data: {
      rating: 3,
      userId: user1.id,
      storeId: store2.id,
    },
  });

  console.log('Initial ratings seeded.');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
