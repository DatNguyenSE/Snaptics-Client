import { Injectable, signal } from '@angular/core';
import { of, delay } from 'rxjs';
import { AdminCategory, CategoryType } from '../models/admin.models';
import { MOCK_CATEGORIES } from '../data/admin-mock-data';
import { AuditLogService } from './audit-log.service';
import { inject } from '@angular/core';

// TODO: Replace mock implementation with Admin API.
// GET    /api/admin/categories
// POST   /api/admin/categories
// PUT    /api/admin/categories/:id
// DELETE /api/admin/categories/:id

let _catIdCounter = MOCK_CATEGORIES.length + 1;

@Injectable({ providedIn: 'root' })
export class AdminCategoryService {
  private readonly auditLog = inject(AuditLogService);
  private readonly _categories = signal<AdminCategory[]>(structuredClone(MOCK_CATEGORIES));

  readonly categories = this._categories.asReadonly();

  getCategories(filter?: { search?: string; type?: CategoryType | ''; active?: boolean | null }) {
    let data = this._categories();
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      data = data.filter(
        (c) => c.nameVi.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q)
      );
    }
    if (filter?.type) data = data.filter((c) => c.type === filter.type);
    if (filter?.active !== null && filter?.active !== undefined) {
      data = data.filter((c) => c.isActive === filter.active);
    }
    return of(data).pipe(delay(200));
  }

  createCategory(cat: Omit<AdminCategory, 'id' | 'usageCount' | 'updatedAt'>): void {
    const newCat: AdminCategory = {
      ...cat,
      id: `cat_${String(_catIdCounter++).padStart(3, '0')}`,
      usageCount: 0,
      updatedAt: new Date().toISOString(),
    };
    this._categories.update((cats) => [...cats, newCat]);
    this.auditLog.addLog({
      action: 'Create Category',
      target: `${cat.nameVi} (${cat.nameEn})`,
      reason: 'New category created by admin',
      riskLevel: 'low',
    });
  }

  updateCategory(id: string, changes: Partial<AdminCategory>, reason = 'Admin update'): void {
    const target = this._categories().find((c) => c.id === id);
    this._categories.update((cats) =>
      cats.map((c) =>
        c.id === id ? { ...c, ...changes, updatedAt: new Date().toISOString() } : c
      )
    );
    if (target) {
      this.auditLog.addLog({
        action: 'Update Category',
        target: `${target.nameVi} (${target.nameEn})`,
        targetId: id,
        reason,
        riskLevel: 'low',
        beforeValue: target as unknown as Record<string, unknown>,
        afterValue: changes as Record<string, unknown>,
      });
    }
  }

  toggleStatus(id: string, reason = 'Admin toggled status'): void {
    const cat = this._categories().find((c) => c.id === id);
    if (!cat) return;
    this.updateCategory(id, { isActive: !cat.isActive }, reason);
    this.auditLog.addLog({
      action: cat.isActive ? 'Disable Category' : 'Enable Category',
      target: `${cat.nameVi}`,
      targetId: id,
      reason,
      riskLevel: 'low',
    });
  }

  duplicateCategory(id: string): void {
    const cat = this._categories().find((c) => c.id === id);
    if (!cat) return;
    this.createCategory({
      ...cat,
      nameVi: `${cat.nameVi} (Copy)`,
      nameEn: `${cat.nameEn} (Copy)`,
      isDefault: false,
      isActive: false,
    });
  }

  deleteCategory(id: string, reason: string): void {
    const cat = this._categories().find((c) => c.id === id);
    this._categories.update((cats) => cats.filter((c) => c.id !== id));
    if (cat) {
      this.auditLog.addLog({
        action: 'Delete Category',
        target: cat.nameVi,
        targetId: id,
        reason,
        riskLevel: 'medium',
      });
    }
  }
}
