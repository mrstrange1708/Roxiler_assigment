import { Response } from 'express';
import * as bcrypt from 'bcryptjs';
import prisma from '../utils/db';
import { AuthRequest } from '../middleware/auth';
import { validateUserFields, validateName, validateEmail, validateAddress } from '../utils/validation';
import { Role } from '../../generated/prisma/client';

// 1. Dashboard Statistics
export async function getDashboardStats(req: AuthRequest, res: Response) {
  try {
    const totalUsers = await prisma.user.count();
    const totalStores = await prisma.store.count();
    const totalRatings = await prisma.rating.count();

    res.json({
      totalUsers,
      totalStores,
      totalRatings,
    });
  } catch (error: any) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ error: 'Server error retrieving statistics.' });
  }
}

// 2. Add New Admin/Normal User
export async function addUser(req: AuthRequest, res: Response) {
  try {
    const { name, email, password, address, role } = req.body;

    if (!role || !Object.values(Role).includes(role)) {
      res.status(400).json({ error: 'Validation failed', errors: { role: 'Invalid role selection.' } });
      return;
    }

    // Validate fields
    const { isValid, errors } = validateUserFields({ name, email, password, address });
    if (!isValid) {
      res.status(400).json({ error: 'Validation failed', errors });
      return;
    }

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      res.status(400).json({ error: 'Failed to add user', errors: { email: 'Email is already registered.' } });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        address,
        role: role as Role,
      },
    });

    res.status(201).json({
      message: 'User created successfully.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error('Add user error:', error);
    res.status(500).json({ error: 'Server error adding new user.' });
  }
}

// 3. Add New Store & Owner
export async function addStore(req: AuthRequest, res: Response) {
  try {
    const {
      storeName,
      storeEmail,
      storeAddress,
      ownerName,
      ownerEmail,
      ownerPassword,
      ownerAddress,
    } = req.body;

    // Validate store fields
    const storeNameErr = validateName(storeName);
    const storeEmailErr = validateEmail(storeEmail);
    const storeAddressErr = validateAddress(storeAddress);

    const storeErrors: any = {};
    if (storeNameErr) storeErrors.storeName = storeNameErr;
    if (storeEmailErr) storeErrors.storeEmail = storeEmailErr;
    if (storeAddressErr) storeErrors.storeAddress = storeAddressErr;

    // Validate owner fields
    const { isValid: isOwnerValid, errors: ownerErrors } = validateUserFields({
      name: ownerName,
      email: ownerEmail,
      password: ownerPassword,
      address: ownerAddress,
    });

    if (Object.keys(storeErrors).length > 0 || !isOwnerValid) {
      res.status(400).json({
        error: 'Validation failed',
        errors: { ...storeErrors, ...ownerErrors },
      });
      return;
    }

    // Check unique emails
    const existingStoreEmail = await prisma.store.findUnique({
      where: { email: storeEmail },
    });
    if (existingStoreEmail) {
      res.status(400).json({
        error: 'Registration failed',
        errors: { storeEmail: 'Store email already exists.' },
      });
      return;
    }

    const existingOwnerEmail = await prisma.user.findUnique({
      where: { email: ownerEmail },
    });
    if (existingOwnerEmail) {
      res.status(400).json({
        error: 'Registration failed',
        errors: { ownerEmail: 'Owner email is already registered.' },
      });
      return;
    }

    // Create both user and store inside transaction
    const salt = await bcrypt.genSalt(10);
    const hashedOwnerPassword = await bcrypt.hash(ownerPassword, salt);

    const result = await prisma.$transaction(async (tx) => {
      const owner = await tx.user.create({
        data: {
          name: ownerName,
          email: ownerEmail,
          password: hashedOwnerPassword,
          address: ownerAddress,
          role: Role.STORE_OWNER,
        },
      });

      const store = await tx.store.create({
        data: {
          name: storeName,
          email: storeEmail,
          address: storeAddress,
          ownerId: owner.id,
        },
      });

      return { owner, store };
    });

    res.status(201).json({
      message: 'Store and Owner registered successfully.',
      store: result.store,
      owner: {
        id: result.owner.id,
        name: result.owner.name,
        email: result.owner.email,
        role: result.owner.role,
      },
    });
  } catch (error: any) {
    console.error('Add store error:', error);
    res.status(500).json({ error: 'Server error registering store.' });
  }
}

// 4. View list of Stores with Overall Rating
export async function getStores(req: AuthRequest, res: Response) {
  try {
    const { name, email, address, sortBy, sortOrder } = req.query;

    // Filters
    const where: any = {};
    if (name) {
      where.name = { contains: String(name), mode: 'insensitive' };
    }
    if (email) {
      where.email = { contains: String(email), mode: 'insensitive' };
    }
    if (address) {
      where.address = { contains: String(address), mode: 'insensitive' };
    }

    // Fetch stores and their ratings
    const stores = await prisma.store.findMany({
      where,
      include: {
        ratings: true,
      },
    });

    // Compute average ratings
    let formattedStores = stores.map((s) => {
      const totalRatings = s.ratings.length;
      const averageRating =
        totalRatings > 0
          ? s.ratings.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings
          : 0;

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        address: s.address,
        averageRating: Number(averageRating.toFixed(2)),
        totalRatings,
      };
    });

    // Handle sorting
    const sBy = String(sortBy || 'name');
    const sOrder = String(sortOrder || 'asc').toLowerCase();

    formattedStores.sort((a: any, b: any) => {
      let valA = a[sBy];
      let valB = b[sBy];

      // Handle overall rating sorting field alias
      if (sBy === 'rating') {
        valA = a.averageRating;
        valB = b.averageRating;
      }

      if (typeof valA === 'string') {
        return sOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return sOrder === 'asc' ? valA - valB : valB - valA;
      }
    });

    res.json(formattedStores);
  } catch (error: any) {
    console.error('Get stores error:', error);
    res.status(500).json({ error: 'Server error retrieving stores.' });
  }
}

// 5. View list of users with sorting & filters
export async function getUsers(req: AuthRequest, res: Response) {
  try {
    const { name, email, address, role, sortBy, sortOrder } = req.query;

    const where: any = {};
    if (name) {
      where.name = { contains: String(name), mode: 'insensitive' };
    }
    if (email) {
      where.email = { contains: String(email), mode: 'insensitive' };
    }
    if (address) {
      where.address = { contains: String(address), mode: 'insensitive' };
    }
    if (role && Object.values(Role).includes(role as Role)) {
      where.role = role as Role;
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        ownedStore: {
          include: {
            ratings: true,
          },
        },
      },
    });

    // Format users (include average rating if they are STORE_OWNER)
    const formattedUsers = users.map((u) => {
      let averageRating: number | null = null;
      if (u.role === Role.STORE_OWNER && u.ownedStore) {
        const ratings = u.ownedStore.ratings;
        averageRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        address: u.address,
        role: u.role,
        averageRating: averageRating !== null ? Number(averageRating.toFixed(2)) : null,
      };
    });

    // Handle sorting
    const sBy = String(sortBy || 'name');
    const sOrder = String(sortOrder || 'asc').toLowerCase();

    formattedUsers.sort((a: any, b: any) => {
      let valA = a[sBy];
      let valB = b[sBy];

      // Handle rating field comparison for store owners
      if (sBy === 'rating') {
        valA = a.averageRating ?? -1;
        valB = b.averageRating ?? -1;
      }

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'string') {
        return sOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return sOrder === 'asc' ? valA - valB : valB - valA;
      }
    });

    res.json(formattedUsers);
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error retrieving users.' });
  }
}

// 6. Get Single User Details (with Rating if Store Owner)
export async function getUserDetails(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        ownedStore: {
          include: {
            ratings: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    let averageRating: number | null = null;
    let storeDetails: any = null;

    if (user.role === Role.STORE_OWNER && user.ownedStore) {
      const ratings = user.ownedStore.ratings;
      averageRating =
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : 0;
      averageRating = Number(averageRating.toFixed(2));
      storeDetails = {
        id: user.ownedStore.id,
        name: user.ownedStore.name,
        email: user.ownedStore.email,
        address: user.ownedStore.address,
      };
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
      averageRating,
      store: storeDetails,
    });
  } catch (error: any) {
    console.error('User details fetch error:', error);
    res.status(500).json({ error: 'Server error retrieving user details.' });
  }
}
