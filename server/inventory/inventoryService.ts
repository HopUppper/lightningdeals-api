import { prisma, encryptText, decryptText } from '../db';
import { recordAuditEvent } from '../auditLogger';

/**
 * ============================================================================
 * ⚡ INVENTORY SERVICE — LIGHTNINGAPI.PRO
 * ============================================================================
 * Concurrency-safe inventory tracking for products requiring inventory credentials
 * (licenses, logins, accounts, keys).
 */

export interface AddInventoryItemInput {
  planId: string;
  secretData: string;
  displayValue?: string;
  sku?: string;
  notes?: string;
}

export class InventoryService {
  /**
   * Adds new inventory items with encryption
   */
  static async addInventoryItem(input: AddInventoryItemInput, adminId?: string) {
    const { planId, secretData, displayValue, sku, notes } = input;

    // Mask display value if not explicitly given
    const masked = displayValue ||
      (secretData.length > 8
        ? `${secretData.substring(0, 4)}...${secretData.substring(secretData.length - 4)}`
        : '••••••••');

    const encrypted = encryptText(secretData);

    const item = await prisma.inventoryItem.create({
      data: {
        planId,
        sku,
        dataEncrypted: encrypted,
        displayValue: masked,
        status: 'AVAILABLE',
        notes,
      },
    });

    await recordAuditEvent({
      eventType: 'INVENTORY_ADDED',
      severity: 'INFO',
      actorType: 'ADMIN',
      adminId,
      resourceType: 'SYSTEM',
      resourceId: item.id,
      action: 'ADD_INVENTORY',
      result: 'SUCCESS',
      metadata: { planId, sku, displayValue: masked },
    });

    return item;
  }

  /**
   * Bulk adds inventory items
   */
  static async addBulkInventoryItems(planId: string, items: string[], adminId?: string) {
    const created: any[] = [];
    for (const raw of items) {
      if (raw && raw.trim()) {
        const item = await this.addInventoryItem({ planId, secretData: raw.trim() }, adminId);
        created.push(item);
      }
    }
    return created;
  }

  /**
   * Concurrency-safe atomic assignment of an inventory item to an order/customer.
   * Returns assigned item or null if out of stock.
   */
  static async assignInventoryItem(planId: string, orderId: string, userId: string, tx: any = prisma) {
    return await tx.$transaction(async (t: any) => {
      // Find one available item with FOR UPDATE lock if supported, or atomic findFirst + updateMany
      const available = await t.inventoryItem.findFirst({
        where: {
          planId,
          status: 'AVAILABLE',
        },
        orderBy: { createdAt: 'asc' },
      });

      if (!available) {
        return null;
      }

      // Atomic lock via updateMany with status: 'AVAILABLE'
      const updatedCount = await t.inventoryItem.updateMany({
        where: {
          id: available.id,
          status: 'AVAILABLE',
        },
        data: {
          status: 'ASSIGNED',
          assignedOrderId: orderId,
          assignedUserId: userId,
          usedAt: new Date(),
        },
      });

      if (updatedCount.count === 0) {
        // Contention: item was claimed concurrently, retry once
        const nextAvailable = await t.inventoryItem.findFirst({
          where: { planId, status: 'AVAILABLE' },
          orderBy: { createdAt: 'asc' },
        });

        if (!nextAvailable) return null;

        const secondAttempt = await t.inventoryItem.updateMany({
          where: { id: nextAvailable.id, status: 'AVAILABLE' },
          data: {
            status: 'ASSIGNED',
            assignedOrderId: orderId,
            assignedUserId: userId,
            usedAt: new Date(),
          },
        });

        if (secondAttempt.count === 0) return null;
        return nextAvailable;
      }

      await recordAuditEvent({
        eventType: 'INVENTORY_ASSIGNED',
        severity: 'INFO',
        actorType: 'SYSTEM',
        customerId: userId,
        resourceType: 'ORDER',
        resourceId: orderId,
        action: 'ASSIGN_INVENTORY',
        result: 'SUCCESS',
        metadata: { planId, itemId: available.id },
      });

      return available;
    });
  }

  /**
   * Releases an assigned or reserved inventory item back to AVAILABLE (e.g. on refund or order cancellation)
   */
  static async releaseInventoryItem(itemId: string, reason: string = 'ORDER_CANCELLED', tx: any = prisma) {
    const item = await tx.inventoryItem.findUnique({ where: { id: itemId } });
    if (!item) return null;

    const updated = await tx.inventoryItem.update({
      where: { id: itemId },
      data: {
        status: 'AVAILABLE',
        assignedOrderId: null,
        assignedUserId: null,
        notes: item.notes ? `${item.notes} | Released: ${reason}` : `Released: ${reason}`,
      },
    });

    await recordAuditEvent({
      eventType: 'INVENTORY_RELEASED',
      severity: 'INFO',
      actorType: 'SYSTEM',
      resourceType: 'ORDER',
      resourceId: item.assignedOrderId || undefined,
      action: 'RELEASE_INVENTORY',
      result: 'SUCCESS',
      metadata: { itemId, reason },
    });

    return updated;
  }

  /**
   * Checks available inventory count for a plan
   */
  static async getAvailableCount(planId: string): Promise<number> {
    return await prisma.inventoryItem.count({
      where: { planId, status: 'AVAILABLE' },
    });
  }

  /**
   * Checks low-stock products across all plans
   */
  static async getLowStockAlerts() {
    const plansWithInventory = await prisma.plan.findMany({
      where: { requiresInventory: true, enabled: true },
      select: {
        id: true,
        name: true,
        displayName: true,
        lowStockThreshold: true,
      },
    });

    const alerts: Array<{
      planId: string;
      planName: string;
      displayName: string;
      availableCount: number;
      threshold: number;
      isOutOfStock: boolean;
    }> = [];

    for (const plan of plansWithInventory) {
      const count = await this.getAvailableCount(plan.id);
      if (count <= plan.lowStockThreshold) {
        alerts.push({
          planId: plan.id,
          planName: plan.name,
          displayName: plan.displayName,
          availableCount: count,
          threshold: plan.lowStockThreshold,
          isOutOfStock: count === 0,
        });
      }
    }

    return alerts;
  }

  /**
   * Decrypts and retrieves the secret data for an inventory item (Admin only)
   */
  static decryptSecretData(item: { dataEncrypted: string }): string {
    return decryptText(item.dataEncrypted);
  }
}
