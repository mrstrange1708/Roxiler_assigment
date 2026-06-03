import { Response } from 'express';
import prisma from '../utils/db';
import { AuthRequest } from '../middleware/auth';

// 1. Get Stores list for Normal Users
export async function getStoresForUser(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { search, sortBy, sortOrder } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { address: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    // Fetch stores
    const stores = await prisma.store.findMany({
      where,
      include: {
        ratings: true,
      },
    });

    // Format output
    let formatted = stores.map((s) => {
      const totalRatings = s.ratings.length;
      const averageRating =
        totalRatings > 0
          ? s.ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
          : 0;

      // Find if this user submitted a rating
      const userRatingRecord = s.ratings.find((r) => r.userId === userId);
      const userSubmittedRating = userRatingRecord ? userRatingRecord.rating : null;

      return {
        id: s.id,
        name: s.name,
        address: s.address,
        email: s.email,
        averageRating: Number(averageRating.toFixed(2)),
        totalRatings,
        userSubmittedRating,
      };
    });

    // Handle sorting
    const sBy = String(sortBy || 'name');
    const sOrder = String(sortOrder || 'asc').toLowerCase();

    formatted.sort((a: any, b: any) => {
      let valA = a[sBy];
      let valB = b[sBy];

      // Custom alias sorting fields
      if (sBy === 'rating') {
        valA = a.averageRating;
        valB = b.averageRating;
      } else if (sBy === 'myRating') {
        valA = a.userSubmittedRating ?? -1;
        valB = b.userSubmittedRating ?? -1;
      }

      if (typeof valA === 'string') {
        return sOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return sOrder === 'asc' ? valA - valB : valB - valA;
      }
    });

    res.json(formatted);
  } catch (error: any) {
    console.error('User stores list error:', error);
    res.status(500).json({ error: 'Server error fetching store list.' });
  }
}

// 2. Submit or Modify a Rating (Upsert)
export async function submitRating(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const { storeId, rating } = req.body;

    if (!storeId || rating === undefined) {
      res.status(400).json({ error: 'Store ID and rating are required.' });
      return;
    }

    const ratingVal = parseInt(rating, 10);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
      return;
    }

    // Check if store exists
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!store) {
      res.status(404).json({ error: 'Store not found.' });
      return;
    }

    // Upsert the rating (User can only submit one rating per store, which matches the schema @@unique([userId, storeId]))
    const savedRating = await prisma.rating.upsert({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },
      update: {
        rating: ratingVal,
      },
      create: {
        userId,
        storeId,
        rating: ratingVal,
      },
    });

    res.json({
      message: 'Rating saved successfully.',
      rating: savedRating,
    });
  } catch (error: any) {
    console.error('Submit rating error:', error);
    res.status(500).json({ error: 'Server error saving rating.' });
  }
}
