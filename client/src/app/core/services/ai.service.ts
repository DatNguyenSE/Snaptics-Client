import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, first, switchMap, throwError, of, merge } from 'rxjs';
import { environment } from '../../environments/environment';
import { ReadBillResponseDto } from '../../models/ai-bill.dto';
import { NotificationService } from './notification-service';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly notificationService = inject(NotificationService);

  analyzeImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    
    // 1. Post to backend to trigger SQS job
    return this.http.post<any>(`${this.apiUrl}ai/analyze-image`, formData).pipe(
      // 2. Wait for SignalR to push result
      switchMap(() => this.waitForAiResult<any>())
    );
  }

  readBill(file: File): Observable<ReadBillResponseDto> {
    const formData = new FormData();
    formData.append('billImage', file);
    
    return this.http.post<any>(`${this.apiUrl}ai/read-bill`, formData).pipe(
      switchMap(() => this.waitForAiResult<ReadBillResponseDto>())
    );
  }

  ask(message: string): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(`${this.apiUrl}AiAssistant/ask`, { message });
  }

  private waitForAiResult<T>(): Observable<T> {
    return new Observable<T>(observer => {
      const resultSub = this.notificationService.aiResult$.subscribe((res: T) => {
        observer.next(res);
        observer.complete();
      });
      const errorSub = this.notificationService.aiError$.subscribe((err: string) => {
        observer.error(err);
      });

      return () => {
        resultSub.unsubscribe();
        errorSub.unsubscribe();
      };
    }).pipe(first());
  }
}
