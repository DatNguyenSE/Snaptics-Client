import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ReadBillResponseDto } from '../../models/ai-bill.dto';
import { NotificationService } from './notification-service';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl.endsWith('/')
    ? environment.apiUrl
    : environment.apiUrl + '/';
  private readonly aiScanUrl = `${this.baseUrl}ai`;
  private readonly aiAssistantUrl = `${this.baseUrl}AiAssistant`;

  private readonly notificationService = inject(NotificationService);

  analyzeImage(file: File, trackCalories?: boolean, estimatePrice?: boolean): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    
    let params = new HttpParams();
    if (trackCalories !== undefined && trackCalories !== null) {
      params = params.set('trackCalories', trackCalories.toString());
    }
    if (estimatePrice !== undefined && estimatePrice !== null) {
      params = params.set('estimatePrice', estimatePrice.toString());
    }

    return this.requestAndWaitForAiResult(`${this.aiScanUrl}/analyze-image`, formData, params);
  }

  readBill(file: File): Observable<ReadBillResponseDto> {
    const formData = new FormData();
    formData.append('billImage', file);
    
    return this.requestAndWaitForAiResult<ReadBillResponseDto>(`${this.aiScanUrl}/read-bill`, formData);
  }

  ask(message: string): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(`${this.aiAssistantUrl}/ask`, { message }).pipe(
      catchError(err => throwError(() => err))
    );
  }

  generateInsights(): Observable<any> {
    return this.http.post<any>(`${this.aiAssistantUrl}/insight`, {}).pipe(
      catchError(err => throwError(() => err))
    );
  }

  private requestAndWaitForAiResult<T>(url: string, formData: FormData, params?: HttpParams): Observable<T> {
    return new Observable<T>((observer) => {
      const resultSub = this.notificationService.aiResult$.subscribe((result: T) => {
        observer.next(result);
        observer.complete();
      });
      const errorSub = this.notificationService.aiError$.subscribe((error: string) => {
        observer.error(error);
      });
      const requestSub = this.http.post(url, formData, { params }).subscribe({
        error: (error) => observer.error(error),
      });

      return () => {
        resultSub.unsubscribe();
        errorSub.unsubscribe();
        requestSub.unsubscribe();
      };
    });
  }
}
