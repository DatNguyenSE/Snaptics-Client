import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface S3ViewResponse {
  url: string;
}

export interface S3UploadResponse {
  key: string;
  url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class S3Service {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl.endsWith('/')
    ? environment.apiUrl + 's3'
    : environment.apiUrl + '/s3';

  uploadFile(file: File): Observable<S3UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<S3UploadResponse>(`${this.apiUrl}/upload`, formData).pipe(
      catchError(err => throwError(() => err))
    );
  }

  viewImage(key: string): Observable<S3ViewResponse> {
    const params = new HttpParams().set('key', key);
    return this.http.get<S3ViewResponse>(`${this.apiUrl}/view`, { params }).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getDirectImageUrl(key: string): string {
    return `${this.apiUrl}/image?key=${encodeURIComponent(key)}`;
  }
}
