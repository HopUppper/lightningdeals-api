import { prisma } from '../db';
import { recordAuditEvent } from '../auditLogger';

export interface RecordVendorRenewalParams {
  providerId: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  periodDays?: number;
  periodStart?: Date;
  periodEnd?: Date;
  renewalCost?: number;
  currency?: string;
  vendorReference?: string;
  failureReason?: string;
  notes?: string;
  initiatedBy?: 'SYSTEM' | 'ADMIN';
  adminUserId?: string;
}

export interface VendorLifecycleStatus {
  providerId: string;
  providerName: string;
  providerStatus: string;
  vendorSubscriptionStatus: string;
  vendorCurrentPeriodStart: Date | null;
  vendorCurrentPeriodEnd: Date | null;
  daysUntilVendorRenewal: number | null;
  vendorRenewalCount: number;
  vendorLastRenewedAt: Date | null;
  vendorAutoRenew: boolean;
  recentRenewals: any[];
}

/**
 * ============================================================================
 * ⚡ VENDOR SUBSCRIPTION RENEWAL SERVICE — LIGHTNINGAPI.PRO
 * ============================================================================
 * Manages upstream vendor subscriptions and renewal events.
 * 
 * CORE ARCHITECTURAL RULE:
 * Upstream vendor subscriptions renew on their own schedule (e.g. monthly 30-day cycle).
 * Vendor renewal events update ONLY the VendorProvider operational record and
 * log a VendorRenewalEvent.
 * 
 * Vendor renewals NEVER:
 * - Alter customer ApiKey.expiresAt
 * - Alter customer Subscription.expiryTime
 * - Reset customer purchase dates
 * - Grant unexpected customer entitlements
 * - Charge customers
 * ============================================================================
 */
export class VendorRenewalService {
  /**
   * Records an upstream vendor renewal attempt (success or failure)
   * strictly isolated from customer lifecycles.
   */
  static async recordVendorRenewal(params: RecordVendorRenewalParams) {
    const {
      providerId,
      status,
      periodDays = 30,
      periodStart = new Date(),
      renewalCost,
      currency = 'USD',
      vendorReference,
      failureReason,
      notes,
      initiatedBy = 'SYSTEM',
      adminUserId,
    } = params;

    const provider = await prisma.vendorProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new Error(`Vendor provider with ID '${providerId}' not found.`);
    }

    const calculatedPeriodEnd =
      params.periodEnd ||
      new Date(periodStart.getTime() + Math.max(1, periodDays) * 24 * 60 * 60 * 1000);

    // 1. Create audit-tracked VendorRenewalEvent
    const renewalEvent = await prisma.vendorRenewalEvent.create({
      data: {
        providerId,
        status,
        periodStart,
        periodEnd: calculatedPeriodEnd,
        renewalCost: renewalCost !== undefined ? Number(renewalCost) : null,
        currency,
        vendorReference: vendorReference || `VND-RNW-${Date.now()}`,
        failureReason: status === 'FAILED' ? (failureReason || 'Upstream vendor renewal rejected') : null,
        notes: notes || `Vendor renewal processed via ${initiatedBy}`,
        initiatedBy,
      },
    });

    // 2. Update VendorProvider operational status only
    const newSubscriptionStatus = status === 'SUCCESS' ? 'active' : 'failed';
    const updatedProvider = await prisma.vendorProvider.update({
      where: { id: providerId },
      data: {
        vendorSubscriptionStatus: newSubscriptionStatus,
        vendorCurrentPeriodStart: periodStart,
        vendorCurrentPeriodEnd: calculatedPeriodEnd,
        vendorLastRenewedAt: status === 'SUCCESS' ? new Date() : provider.vendorLastRenewedAt,
        vendorRenewalCount: status === 'SUCCESS' ? { increment: 1 } : undefined,
        vendorNextRenewalDate: calculatedPeriodEnd,
        // If renewal failed, flag health status
        healthStatus: status === 'FAILED' ? 'degraded' : provider.healthStatus,
        lastError: status === 'FAILED' ? (failureReason || 'Vendor subscription renewal failed') : provider.lastError,
      },
    });

    // 3. Record Audit Event
    await recordAuditEvent({
      eventType: status === 'SUCCESS' ? 'VENDOR_SUBSCRIPTION_RENEWED' : 'VENDOR_SUBSCRIPTION_RENEWAL_FAILED',
      severity: status === 'SUCCESS' ? 'INFO' : 'CRITICAL',
      actorType: initiatedBy === 'ADMIN' ? 'ADMIN' : 'SYSTEM',
      actorId: adminUserId || 'SYSTEM',
      adminId: adminUserId,
      resourceType: 'SUPPLIER',
      resourceId: provider.id,
      action: 'VENDOR_RENEWAL',
      result: status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      failureReason: status === 'FAILED' ? failureReason : undefined,
      metadata: {
        providerId,
        providerName: provider.name,
        periodDays,
        periodStart,
        periodEnd: calculatedPeriodEnd,
        vendorReference: renewalEvent.vendorReference,
        customerEntitlementsAffected: 0, // Guarantees zero alteration of customer records
      },
    });

    return {
      success: status === 'SUCCESS',
      event: renewalEvent,
      provider: updatedProvider,
      message:
        status === 'SUCCESS'
          ? `Vendor subscription for '${provider.name}' renewed successfully until ${calculatedPeriodEnd.toLocaleDateString()}. Customer entitlements remain independent and unaffected.`
          : `Vendor subscription renewal for '${provider.name}' failed: ${failureReason || 'Unknown error'}.`,
    };
  }

  /**
   * Retrieves operational vendor lifecycle information
   * displaying separation between provider and customer lifecycles.
   */
  static async getVendorLifecycleStatus(providerId: string): Promise<VendorLifecycleStatus> {
    const provider = await prisma.vendorProvider.findUnique({
      where: { id: providerId },
      include: {
        vendorRenewalEvents: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!provider) {
      throw new Error(`Vendor provider with ID '${providerId}' not found.`);
    }

    const now = new Date();
    let daysUntilVendorRenewal: number | null = null;
    if (provider.vendorCurrentPeriodEnd) {
      const diffMs = provider.vendorCurrentPeriodEnd.getTime() - now.getTime();
      daysUntilVendorRenewal = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    }

    return {
      providerId: provider.id,
      providerName: provider.name,
      providerStatus: provider.status,
      vendorSubscriptionStatus: provider.vendorSubscriptionStatus || 'active',
      vendorCurrentPeriodStart: provider.vendorCurrentPeriodStart,
      vendorCurrentPeriodEnd: provider.vendorCurrentPeriodEnd,
      daysUntilVendorRenewal,
      vendorRenewalCount: provider.vendorRenewalCount || 0,
      vendorLastRenewedAt: provider.vendorLastRenewedAt,
      vendorAutoRenew: provider.vendorAutoRenew !== false,
      recentRenewals: provider.vendorRenewalEvents,
    };
  }
}
