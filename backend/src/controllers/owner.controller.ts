import { Response } from 'express';
import prisma from '../utils/db';
import { AuthRequest } from '../middleware/auth';

export async function getOwnerDashboard(req: AuthRequest, res: Response) {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const { sortBy, sortOrder } = req.query;

    // Fetch the store owned by this user
    const store = await prisma.store.findUnique({
      where: { ownerId },
      include: {
        ratings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                address: true,
              },
            },
          },
        },
      },
    });

    if (!store) {
      res.status(404).json({ error: 'No store associated with this store owner account.' });
      return;
    }

    // Compute average rating
    const totalRatings = store.ratings.length;
    const averageRating =
      totalRatings > 0
        ? store.ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
        : 0;

    // Format list of users who submitted ratings
    let raters = store.ratings.map((r) => ({
      ratingId: r.id,
      rating: r.rating,
      createdAt: r.createdAt,
      userId: r.user.id,
      userName: r.user.name,
      userEmail: r.user.email,
      userAddress: r.user.address,
    }));

    // Handle sorting
    const sBy = String(sortBy || 'date'); // Default sort by date
    const sOrder = String(sortOrder || 'desc').toLowerCase(); // Default desc (newest first)

    raters.sort((a: any, b: any) => {
      let valA: any;
      let valB: any;

      if (sBy === 'name') {
        valA = a.userName;
        valB = b.userName;
      } else if (sBy === 'email') {
        valA = a.userEmail;
        valB = b.userEmail;
      } else if (sBy === 'address') {
        valA = a.userAddress;
        valB = b.userAddress;
      } else if (sBy === 'rating') {
        valA = a.rating;
        valB = b.rating;
      } else {
        // Date sorting
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      }

      if (typeof valA === 'string') {
        return sOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return sOrder === 'asc' ? valA - valB : valB - valA;
      }
    });

    res.json({
      storeId: store.id,
      storeName: store.name,
      storeAddress: store.address,
      averageRating: Number(averageRating.toFixed(2)),
      totalRatings,
      raters,
    });
  } catch (error: any) {
    console.error('Owner dashboard error:', error);
    res.status(500).json({ error: 'Server error retrieving owner dashboard data.' });
  }
}
