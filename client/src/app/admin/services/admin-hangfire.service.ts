import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { HangfireJob, UpdateHangfireScheduleRequest } from '../models/hangfire.models';
import { HANGFIRE_DEMO_JOBS } from '../data/hangfire-demo.fixture';

// ─── Endpoint constants ────────────────────────────────────────────────────────
const HANGFIRE_BASE = `/api/admin/hangfire/jobs`;

export interface HangfireJobHistoryItem {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: 'Success' | 'Failed' | 'Running';
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminHangfireService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl.replace(/\/$/, '')}${HANGFIRE_BASE}`;

  // ─── Get all jobs ─────────────────────────────────────────────────────────────
  getHangfireJobs(): Observable<HangfireJob[]> {
    if (environment.useHangfireDemoData) {
      return of([...HANGFIRE_DEMO_JOBS]).pipe(delay(600));
    }
    return this.http.get<HangfireJob[]>(this.baseUrl, { withCredentials: true }).pipe(
      catchError(() => of([]))
    );
  }

  // ─── Trigger a job immediately ────────────────────────────────────────────────
  triggerHangfireJob(jobKey: string): Observable<{ message: string }> {
    if (environment.useHangfireDemoData) {
      return of({ message: `Job "${jobKey}" đã được kích hoạt thành công.` }).pipe(delay(800));
    }
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/${jobKey}/trigger`,
      null,
      { withCredentials: true }
    );
  }

  // ─── Update job schedule ──────────────────────────────────────────────────────
  updateHangfireSchedule(
    jobKey: string,
    payload: UpdateHangfireScheduleRequest
  ): Observable<{ message: string }> {
    if (environment.useHangfireDemoData) {
      return of({ message: `Lịch chạy của job "${jobKey}" đã được cập nhật.` }).pipe(delay(700));
    }
    return this.http.put<{ message: string }>(
      `${this.baseUrl}/${jobKey}/schedule`,
      payload,
      { withCredentials: true }
    );
  }

  // ─── Update job enabled/disabled status ──────────────────────────────────────
  updateHangfireJobStatus(
    jobKey: string,
    isEnabled: boolean
  ): Observable<{ message: string }> {
    if (environment.useHangfireDemoData) {
      return of({ message: `Job "${jobKey}" đã được ${isEnabled ? 'bật' : 'tắt'}.` }).pipe(delay(500));
    }
    return this.http.patch<{ message: string }>(
      `${this.baseUrl}/${jobKey}/status`,
      { isEnabled },
      { withCredentials: true }
    );
  }

  // ─── Get job execution history ────────────────────────────────────────────────
  getHangfireJobHistory(
    jobKey: string,
    page = 1,
    pageSize = 10
  ): Observable<HangfireJobHistoryItem[]> {
    if (environment.useHangfireDemoData) {
      return of([]).pipe(delay(400));
    }
    return this.http.get<HangfireJobHistoryItem[]>(
      `${this.baseUrl}/${jobKey}/history`,
      { params: { page: page.toString(), pageSize: pageSize.toString() }, withCredentials: true }
    ).pipe(
      catchError(() => of([]))
    );
  }
}
