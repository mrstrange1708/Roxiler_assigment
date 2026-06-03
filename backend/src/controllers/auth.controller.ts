import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import prisma from '../utils/db';
import { validateUserFields, validatePassword } from '../utils/validation';
import { AuthRequest } from '../middleware/auth';
import { Role } from '../../generated/prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-store-rating-key-12345';

// 1. Normal User Registration
export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, address } = req.body;

    // Validate fields
    const { isValid, errors } = validateUserFields({ name, email, password, address });
    if (!isValid) {
      res.status(400).json({ error: 'Validation failed', errors });
      return;
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      res.status(400).json({ error: 'Registration failed', errors: { email: 'Email is already registered.' } });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (default is USER role)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        address,
        role: Role.USER,
      },
    });

    res.status(201).json({
      message: 'Registration successful! You can now log in.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
}

// 2. Single Login System
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Create JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
}

// 3. Update Password
export async function changePassword(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      res.status(400).json({ error: 'Both old and new passwords are required.' });
      return;
    }

    // Validate new password
    const passError = validatePassword(newPassword);
    if (passError) {
      res.status(400).json({ error: passError });
      return;
    }

    // Fetch user from DB
    const dbUser = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!dbUser) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, dbUser.password);
    if (!isMatch) {
      res.status(400).json({ error: 'Incorrect current password.' });
      return;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword },
    });

    res.json({ message: 'Password updated successfully!' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error updating password.' });
  }
}
