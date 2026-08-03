import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, Observable, catchError, tap, map } from 'rxjs';
import { AdminCategory, CategoryType } from '../models/admin.models';
import { AuditLogService } from './audit-log.service';
import { environment } from '../../environments/environment';

let _catIdCounter = 1;

@Injectable({ providedIn: 'root' })
export class AdminCategoryService {
  private readonly http = inject(HttpClient);
  private readonly auditLog = inject(AuditLogService);
  private readonly apiUrl = `${environment.apiUrl.replace(/\/$/, '')}/Category`;
  private readonly _categories = signal<AdminCategory[]>([]);

  readonly categories = this._categories.asReadonly();

  getCategories(filter?: { search?: string; type?: CategoryType | ''; active?: boolean | null }): Observable<AdminCategory[]> {
    return this.http.get<any[]>(this.apiUrl, { withCredentials: true }).pipe(
      map((items) => {
        if (Array.isArray(items)) {
          const mapped: AdminCategory[] = items.map((item) => ({
            id: item.id?.toString() || `cat_${_catIdCounter++}`,
            nameVi: item.categoryName || item.nameVi || 'Danh mục',
            nameEn: item.nameEn || item.categoryName || 'Category',
            type: (item.type?.toLowerCase() === 'income' ? 'income' : 'expense') as CategoryType,
            icon: item.icon || 'category',
            description: item.description || '',
            displayOrder: item.displayOrder ?? 0,
            isDefault: item.isDefault ?? false,
            isActive: item.isActive ?? true,
            usageCount: item.usageCount ?? 0,
            updatedAt: item.updatedAt || new Date().toISOString(),
          }));
          this._categories.set(mapped);
          return mapped;
        }
        return this._categories();
      }),
      catchError(() => {
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
        return of(data);
      })
    );
  }

  createCategory(cat: Omit<AdminCategory, 'id' | 'usageCount' | 'updatedAt'>): Observable<AdminCategory> {
    const payload = {
      categoryName: cat.nameVi,
      nameEn: cat.nameEn,
      type: cat.type,
      icon: cat.icon,
      description: cat.description,
      displayOrder: cat.displayOrder,
      isDefault: cat.isDefault,
      isActive: cat.isActive,
    };

    return this.http.post<any>(this.apiUrl, payload, { withCredentials: true }).pipe(
      map((res) => {
        const newCat: AdminCategory = {
          ...cat,
          id: res.id?.toString() || `cat_${String(_catIdCounter++).padStart(3, '0')}`,
          usageCount: 0,
          updatedAt: new Date().toISOString(),
        };
        this._categories.update((cats) => [...cats, newCat]);
        return newCat;
      }),
      catchError(() => {
        const newCat: AdminCategory = {
          ...cat,
          id: `cat_${String(_catIdCounter++).padStart(3, '0')}`,
          usageCount: 0,
          updatedAt: new Date().toISOString(),
        };
        this._categories.update((cats) => [...cats, newCat]);
        return of(newCat);
      }),
      tap((newCat) => {
        this.auditLog.addLog({
          action: 'Create Category',
          target: `${cat.nameVi} (${cat.nameEn})`,
          reason: 'New category created by admin',
          riskLevel: 'low',
        });
      })
    );
  }

  updateCategory(id: string, changes: Partial<AdminCategory>, reason = 'Admin update'): Observable<void> {
    const target = this._categories().find((c) => c.id === id);
    return this.http.put<void>(`${this.apiUrl}/${id}`, changes, { withCredentials: true }).pipe(
      catchError(() => of(void 0)),
      tap(() => {
        this._categories.update((cats) =>
          cats.map((c) => (c.id === id ? { ...c, ...changes, updatedAt: new Date().toISOString() } : c))
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
      })
    );
  }

  toggleStatus(id: string, reason = 'Admin toggled status'): void {
    const cat = this._categories().find((c) => c.id === id);
    if (!cat) return;
    this.updateCategory(id, { isActive: !cat.isActive }, reason).subscribe();
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
    }).subscribe();
  }

  deleteCategory(id: string, reason: string): Observable<void> {
    const cat = this._categories().find((c) => c.id === id);
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { withCredentials: true }).pipe(
      catchError(() => of(void 0)),
      tap(() => {
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
      })
    );
  }
}
