import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    
    return this.requestAndWaitForAiResult(`${this.apiUrl}ai/analyze-image`, formData);
  }

  readBill(file: File): Observable<ReadBillResponseDto> {
    const formData = new FormData();
    formData.append('billImage', file);
    
    return this.requestAndWaitForAiResult<ReadBillResponseDto>(`${this.apiUrl}ai/read-bill`, formData);
  }

  ask(message: string): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(`${this.apiUrl}AiAssistant/ask`, { message });
  }

  private requestAndWaitForAiResult<T>(url: string, formData: FormData): Observable<T> {
    return new Observable<T>((observer) => {
      // Subscribe before starting the request so a fast SignalR result cannot be missed.
      const resultSub = this.notificationService.aiResult$.subscribe((result: T) => {
        observer.next(result);
        observer.complete();
      });
      const errorSub = this.notificationService.aiError$.subscribe((error: string) => {
        observer.error(error);
      });
      const requestSub = this.http.post(url, formData).subscribe({
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
