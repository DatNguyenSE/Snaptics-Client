import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type UsageStatusType = 'NotEvaluated' | 'Frequent' | 'Occasionally' | 'Seldom' | 'Unused';

export interface ItemInventoryDto {
  id: number;
  userId: string;
  transactionDetailId: number;
  itemName?: string;
  amount?: number;
  quantity?: number;
  unit?: string;
  purchaseDate?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  manufactureDate?: string;
  expiryDate?: string;
  estimatedExpiryDays?: number;
  usageFeedback?: string;
  isReviewed: boolean;
  lastReviewDate?: string;
  usageStatus: UsageStatusType;
  createdAt: string;
  updatedAt?: string;
}

export interface ItemInventoryReviewDto {
  id: number;
  usageStatus: UsageStatusType;
}

@Injectable({
  providedIn: 'root',
})
export class ItemInventoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl.endsWith('/')
    ? environment.apiUrl + 'ItemInventory'
    : environment.apiUrl + '/ItemInventory';

  /**
   * PUT /ItemInventory/{id}/review?usageStatus=Frequent
   */
  reviewItem(id: number, usageStatus: UsageStatusType): Observable<any> {
    const params = new HttpParams().set('usageStatus', usageStatus);
    return this.http.put(`${this.baseUrl}/${id}/review`, null, {
      params,
      withCredentials: true,
    });
  }

  /**
   * GET /ItemInventory/user
   */
  getUserItemInventories(): Observable<ItemInventoryDto[]> {
    return this.http.get<ItemInventoryDto[]>(`${this.baseUrl}/user`, {
      withCredentials: true,
    });
  }
}
