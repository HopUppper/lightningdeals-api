import { Router, Response } from 'express';
import { prisma } from '../db';
import { AuthRequest, authenticateJwt, requireAdmin } from '../auth';
import { extractClientIp } from '../geoService';

export const feedbackRouter = Router();

// Permitted feedback categories
const VALID_CATEGORIES = [
  'api_reliability',
  'model_quality',
  'response_speed',
  'pricing_value',
  'documentation',
  'customer_support',
  'other',
] as const;

type FeedbackCategory = typeof VALID_CATEGORIES[number];

// ============================================================================
// 1. PUBLIC CUSTOMER REVIEWS ENDPOINT (STRICTLY ISOLATED)
// ============================================================================

/**
 * GET /api/public/reviews
 * Returns ONLY approved public reviews.
 * NEVER returns or exposes private customer feedback, emails, user IDs, or unapproved records.
 */
feedbackRouter.get('/public/reviews', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 50);
    const sort = req.query.sort === 'rating' ? 'rating' : 'recent';

    // 1. Query ONLY explicitly approved public reviews
    const reviews = await prisma.publicReview.findMany({
      where: {
        isApproved: true,
      },
      select: {
        id: true,
        displayName: true,
        roleOrCompany: true,
        rating: true,
        content: true,
        isFeatured: true,
        verifiedCustomer: true,
        createdAt: true,
      },
      orderBy: sort === 'rating' ? [{ rating: 'desc' }, { createdAt: 'desc' }] : [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });

    // 2. Compute aggregate metrics ONLY from approved public reviews
    const totalCount = await prisma.publicReview.count({
      where: { isApproved: true },
    });

    const agg = await prisma.publicReview.aggregate({
      where: { isApproved: true },
      _avg: { rating: true },
    });

    const averageRating = agg._avg.rating ? Number(agg._avg.rating.toFixed(1)) : null;

    res.json({
      success: true,
      reviews,
      count: totalCount,
      averageRating,
    });
  } catch (error: any) {
    console.error('[PUBLIC REVIEWS] Error fetching public reviews:', error);
    res.status(500).json({
      error: {
        type: 'server_error',
        message: 'Unable to retrieve public reviews at this time.',
      },
    });
  }
});

// ============================================================================
// 2. AUTHENTICATED CUSTOMER PRIVATE FEEDBACK ENDPOINTS
// ============================================================================

/**
 * POST /api/user/feedback
 * Submit private 1-5 star rating and feedback.
 * Stored strictly in CustomerFeedback, NEVER automatically published.
 */
feedbackRouter.post('/user/feedback', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { rating, category, message } = req.body;

    // Validation: Rating must be an integer between 1 and 5
    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        error: {
          type: 'validation_error',
          message: 'Please provide a valid rating between 1 and 5 stars.',
        },
      });
    }

    // Validation: Feedback message must be non-empty and sensible length
    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      return res.status(400).json({
        error: {
          type: 'validation_error',
          message: 'Please provide at least 5 characters of written feedback.',
        },
      });
    }

    if (message.trim().length > 3000) {
      return res.status(400).json({
        error: {
          type: 'validation_error',
          message: 'Feedback message cannot exceed 3,000 characters.',
        },
      });
    }

    // Validation: Category if provided
    let cleanCategory: string | null = null;
    if (category) {
      const catStr = String(category).trim().toLowerCase();
      if (VALID_CATEGORIES.includes(catStr as FeedbackCategory)) {
        cleanCategory = catStr;
      }
    }

    // Rate Limiting & Cooldown: Prevent rapid spam (60-second cooldown per user)
    const recentSubmission = await prisma.customerFeedback.findFirst({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000), // 60 seconds
        },
      },
    });

    if (recentSubmission) {
      return res.status(429).json({
        error: {
          type: 'rate_limited',
          message: 'You recently submitted feedback. Please wait a moment before sending another submission.',
        },
      });
    }

    const userIp = extractClientIp(req);
    const userAgent = req.headers['user-agent'] ? String(req.headers['user-agent']).substring(0, 500) : null;

    // Create private feedback record
    const newFeedback = await prisma.customerFeedback.create({
      data: {
        userId,
        rating: parsedRating,
        category: cleanCategory,
        message: message.trim(),
        status: 'PENDING',
        userIp,
        userAgent,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! Your submission has been received by our engineering leadership.',
      feedback: {
        id: newFeedback.id,
        rating: newFeedback.rating,
        category: newFeedback.category,
        status: newFeedback.status,
        createdAt: newFeedback.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[CUSTOMER FEEDBACK] Submission error:', error);
    res.status(500).json({
      error: {
        type: 'server_error',
        message: 'Failed to record feedback. Please try again later.',
      },
    });
  }
});

/**
 * GET /api/user/feedback/history
 * Retrieve the authenticated customer's own past private feedback submissions.
 */
feedbackRouter.get('/user/feedback/history', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const history = await prisma.customerFeedback.findMany({
      where: { userId },
      select: {
        id: true,
        rating: true,
        category: true,
        message: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({
      success: true,
      history,
    });
  } catch (error: any) {
    console.error('[CUSTOMER FEEDBACK] History error:', error);
    res.status(500).json({
      error: {
        type: 'server_error',
        message: 'Failed to retrieve feedback history.',
      },
    });
  }
});

/**
 * POST /api/user/reviews
 * Submit a public testimonial. Requires explicit consent.
 * Saved as unapproved (`isApproved: false`) until admin review.
 */
feedbackRouter.post('/user/reviews', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { rating, displayName, roleOrCompany, content, consentGiven } = req.body;

    // Mandatory Explicit Consent Check
    if (consentGiven !== true) {
      return res.status(400).json({
        error: {
          type: 'consent_required',
          message: 'Explicit consent is required to submit a public review for publication.',
        },
      });
    }

    // Rating Validation
    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        error: {
          type: 'validation_error',
          message: 'Please provide a valid rating between 1 and 5 stars.',
        },
      });
    }

    // Display Name Validation
    const cleanDisplayName = (displayName && typeof displayName === 'string' ? displayName.trim() : req.user!.name || 'Verified Developer').slice(0, 60);
    if (cleanDisplayName.length < 2) {
      return res.status(400).json({
        error: {
          type: 'validation_error',
          message: 'Please provide a display name with at least 2 characters.',
        },
      });
    }

    // Content Validation
    if (!content || typeof content !== 'string' || content.trim().length < 10) {
      return res.status(400).json({
        error: {
          type: 'validation_error',
          message: 'Please provide at least 10 characters for your public review.',
        },
      });
    }

    if (content.trim().length > 2000) {
      return res.status(400).json({
        error: {
          type: 'validation_error',
          message: 'Review content cannot exceed 2,000 characters.',
        },
      });
    }

    // Check if verified customer based on actual database records
    const [hasApiKey, hasOrder, hasSubscription] = await Promise.all([
      prisma.apiKey.findFirst({ where: { userId, status: 'active' } }),
      prisma.order.findFirst({ where: { userId, status: 'COMPLETED' } }),
      prisma.subscription.findFirst({ where: { userId, status: 'ACTIVE' } }),
    ]);

    const isVerifiedCustomer = Boolean(hasApiKey || hasOrder || hasSubscription);

    // Create unapproved public review
    const review = await prisma.publicReview.create({
      data: {
        userId,
        displayName: cleanDisplayName,
        roleOrCompany: roleOrCompany && typeof roleOrCompany === 'string' ? roleOrCompany.trim().slice(0, 80) : null,
        rating: parsedRating,
        content: content.trim(),
        isApproved: false, // Must be explicitly approved by administrator
        isFeatured: false,
        verifiedCustomer: isVerifiedCustomer,
        consentGiven: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been submitted for editorial verification before publication.',
      review: {
        id: review.id,
        displayName: review.displayName,
        rating: review.rating,
        isApproved: review.isApproved,
        createdAt: review.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[PUBLIC REVIEWS] Submission error:', error);
    res.status(500).json({
      error: {
        type: 'server_error',
        message: 'Failed to submit review. Please try again later.',
      },
    });
  }
});

// ============================================================================
// 3. ADMINISTRATOR PRIVATE FEEDBACK MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/feedback
 * List and filter private customer feedback.
 */
feedbackRouter.get('/admin/feedback', authenticateJwt, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const search = req.query.search ? String(req.query.search).trim() : '';
    const rating = req.query.rating ? parseInt(req.query.rating as string) : undefined;
    const category = req.query.category ? String(req.query.category).trim() : undefined;
    const status = req.query.status ? String(req.query.status).trim() : undefined;
    const sortBy = req.query.sortBy === 'oldest' ? 'asc' : 'desc';

    const where: any = {};

    if (rating && rating >= 1 && rating <= 5) {
      where.rating = rating;
    }

    if (category && VALID_CATEGORIES.includes(category as FeedbackCategory)) {
      where.category = category;
    }

    if (status && ['PENDING', 'REVIEWED', 'RESOLVED', 'ARCHIVED'].includes(status)) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { message: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { id: { contains: search, mode: 'insensitive' } },
        { userId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.customerFeedback.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: sortBy },
        skip,
        take: limit,
      }),
      prisma.customerFeedback.count({ where }),
    ]);

    res.json({
      success: true,
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[ADMIN FEEDBACK] List error:', error);
    res.status(500).json({
      error: {
        type: 'server_error',
        message: 'Failed to retrieve customer feedback.',
      },
    });
  }
});

/**
 * GET /api/admin/feedback/stats
 * Real database statistics for private feedback.
 */
feedbackRouter.get('/admin/feedback/stats', authenticateJwt, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [totalSubmissions, pendingCount, reviewedCount, resolvedCount, archivedCount] = await Promise.all([
      prisma.customerFeedback.count(),
      prisma.customerFeedback.count({ where: { status: 'PENDING' } }),
      prisma.customerFeedback.count({ where: { status: 'REVIEWED' } }),
      prisma.customerFeedback.count({ where: { status: 'RESOLVED' } }),
      prisma.customerFeedback.count({ where: { status: 'ARCHIVED' } }),
    ]);

    // Distinct customer count
    const uniqueUsersAgg = await prisma.customerFeedback.groupBy({
      by: ['userId'],
    });
    const uniqueCustomers = uniqueUsersAgg.length;

    // Rating counts
    const ratingGroups = await prisma.customerFeedback.groupBy({
      by: ['rating'],
      _count: { _all: true },
    });

    const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingGroups.forEach((g) => {
      ratingCounts[g.rating] = g._count._all;
    });

    // Average rating
    const avgAgg = await prisma.customerFeedback.aggregate({
      _avg: { rating: true },
    });
    const averageRating = avgAgg._avg.rating ? Number(avgAgg._avg.rating.toFixed(2)) : 0;

    // Category breakdown
    const categoryGroups = await prisma.customerFeedback.groupBy({
      by: ['category'],
      _count: { _all: true },
    });

    const categoryCounts: Record<string, number> = {};
    categoryGroups.forEach((g) => {
      if (g.category) {
        categoryCounts[g.category] = g._count._all;
      }
    });

    res.json({
      success: true,
      stats: {
        totalSubmissions,
        uniqueCustomers,
        pendingCount,
        reviewedCount,
        resolvedCount,
        archivedCount,
        ratingCounts,
        averageRating,
        categoryCounts,
      },
    });
  } catch (error: any) {
    console.error('[ADMIN FEEDBACK] Stats error:', error);
    res.status(500).json({
      error: {
        type: 'server_error',
        message: 'Failed to calculate feedback statistics.',
      },
    });
  }
});

/**
 * PATCH /api/admin/feedback/:id
 * Update status and/or administrative internal notes.
 */
feedbackRouter.patch('/admin/feedback/:id', authenticateJwt, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const existing = await prisma.customerFeedback.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        error: {
          type: 'not_found',
          message: 'Feedback record not found.',
        },
      });
    }

    const updateData: any = {
      reviewedBy: req.user!.id,
      reviewedAt: new Date(),
    };

    if (status) {
      if (!['PENDING', 'REVIEWED', 'RESOLVED', 'ARCHIVED'].includes(status)) {
        return res.status(400).json({
          error: {
            type: 'validation_error',
            message: 'Invalid status. Must be PENDING, REVIEWED, RESOLVED, or ARCHIVED.',
          },
        });
      }
      updateData.status = status;
    }

    if (adminNotes !== undefined) {
      updateData.adminNotes = typeof adminNotes === 'string' ? adminNotes.trim() : null;
    }

    const updated = await prisma.customerFeedback.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Feedback status updated successfully.',
      feedback: updated,
    });
  } catch (error: any) {
    console.error('[ADMIN FEEDBACK] Update error:', error);
    res.status(500).json({
      error: {
        type: 'server_error',
        message: 'Failed to update feedback record.',
      },
    });
  }
});

/**
 * DELETE /api/admin/feedback/:id
 * Delete or archive feedback record.
 */
feedbackRouter.delete('/admin/feedback/:id', authenticateJwt, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.customerFeedback.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        error: {
          type: 'not_found',
          message: 'Feedback record not found.',
        },
      });
    }

    await prisma.customerFeedback.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Feedback record deleted successfully.',
    });
  } catch (error: any) {
    console.error('[ADMIN FEEDBACK] Delete error:', error);
    res.status(500).json({
      error: {
        type: 'server_error',
        message: 'Failed to delete feedback record.',
      },
    });
  }
});

// ============================================================================
// 4. ADMINISTRATOR PUBLIC REVIEWS MODERATION ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/reviews
 * List all public review submissions for editorial moderation.
 */
feedbackRouter.get('/admin/reviews', authenticateJwt, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const approvedFilter = req.query.isApproved !== undefined ? req.query.isApproved === 'true' : undefined;

    const where: any = {};
    if (approvedFilter !== undefined) {
      where.isApproved = approvedFilter;
    }

    const [reviews, total] = await Promise.all([
      prisma.publicReview.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.publicReview.count({ where }),
    ]);

    res.json({
      success: true,
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[ADMIN REVIEWS] List error:', error);
    res.status(500).json({
      error: {
        type: 'server_error',
        message: 'Failed to retrieve public reviews.',
      },
    });
  }
});

/**
 * PATCH /api/admin/reviews/:id
 * Moderate a public review (Approve, Reject, Feature, Edit display name/content).
 */
feedbackRouter.patch('/admin/reviews/:id', authenticateJwt, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isApproved, isFeatured, displayName, content, roleOrCompany } = req.body;

    const existing = await prisma.publicReview.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        error: {
          type: 'not_found',
          message: 'Review record not found.',
        },
      });
    }

    const updateData: any = {};

    if (isApproved !== undefined) {
      updateData.isApproved = Boolean(isApproved);
      updateData.approvedBy = isApproved ? req.user!.id : null;
      updateData.approvedAt = isApproved ? new Date() : null;
    }

    if (isFeatured !== undefined) {
      updateData.isFeatured = Boolean(isFeatured);
    }

    if (displayName && typeof displayName === 'string') {
      updateData.displayName = displayName.trim().slice(0, 60);
    }

    if (roleOrCompany !== undefined) {
      updateData.roleOrCompany = typeof roleOrCompany === 'string' ? roleOrCompany.trim().slice(0, 80) : null;
    }

    if (content && typeof content === 'string') {
      updateData.content = content.trim().slice(0, 2000);
    }

    const updated = await prisma.publicReview.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      message: updateData.isApproved ? 'Review approved for public publication.' : 'Review updated.',
      review: updated,
    });
  } catch (error: any) {
    console.error('[ADMIN REVIEWS] Moderation error:', error);
    res.status(500).json({
      error: {
        type: 'server_error',
        message: 'Failed to update review status.',
      },
    });
  }
});

/**
 * DELETE /api/admin/reviews/:id
 * Delete a public review.
 */
feedbackRouter.delete('/admin/reviews/:id', authenticateJwt, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.publicReview.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        error: {
          type: 'not_found',
          message: 'Review record not found.',
        },
      });
    }

    await prisma.publicReview.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Review record deleted.',
    });
  } catch (error: any) {
    console.error('[ADMIN REVIEWS] Delete error:', error);
    res.status(500).json({
      error: {
        type: 'server_error',
        message: 'Failed to delete review record.',
      },
    });
  }
});
