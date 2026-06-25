import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  catchError,
  combineLatest,
  finalize,
  map,
  of,
  shareReplay,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { TransactionDto } from '../../models/transaction.dto';
import { environment } from '../../environments/environment.development';
import { CreateTransactionFromBillDto } from '../../models/ai-bill.dto';
import { CreateTransactionEntryDto } from '../../models/transaction-entry.dto';
import { AccountService } from './account-service';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly accountService = inject(AccountService);
  private readonly apiUrl = environment.apiUrl + 'Transaction';
  private readonly remoteTransactionsSubject = new BehaviorSubject<TransactionDto[]>([]);
  private readonly localTransactionsSubject = new BehaviorSubject<TransactionDto[]>([]);
  private readonly transactions$ = combineLatest([
    this.remoteTransactionsSubject,
    this.localTransactionsSubject,
  ]).pipe(
    map(([remoteTransactions, localTransactions]) =>
      this.sortTransactions(this.mergeTransactions(remoteTransactions, localTransactions)),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private hasLoadedRemoteTransactions = false;
  private isLoadingRemoteTransactions = false;

  getTransactions(): Observable<TransactionDto[]> {
    this.ensureTransactionsLoaded();
    return this.transactions$;
  }

  getTransaction(id: number): Observable<TransactionDto> {
    this.ensureTransactionsLoaded();

    return this.transactions$.pipe(
      take(1),
      map((transactions) => transactions.find((transaction) => transaction.id === id) ?? null),
      switchMap((transaction) =>
        transaction ? of(transaction) : this.http.get<TransactionDto>(`${this.apiUrl}/${id}`),
      ),
    );
  }

  createFromBill(data: CreateTransactionFromBillDto, file: File | null): Observable<TransactionDto> {
    const formData = new FormData();
    formData.append('data', JSON.stringify(data));
    if (file) {
      formData.append('image', file);
    }

    return this.http.post<TransactionDto>(`${this.apiUrl}/from-bill`, formData).pipe(
      tap((transaction) => {
        this.upsertRemoteTransaction(transaction);
      }),
    );
  }

  createTransactionEntry(data: CreateTransactionEntryDto): Observable<TransactionDto> {
    const transaction = this.buildLocalTransaction(data);
    const nextTransactions = this.sortTransactions([
      transaction,
      ...this.localTransactionsSubject.value.filter(
        (existingTransaction) => existingTransaction.id !== transaction.id,
      ),
    ]);

    this.localTransactionsSubject.next(nextTransactions);
    return of(transaction);
  }

  private ensureTransactionsLoaded(): void {
    if (this.hasLoadedRemoteTransactions || this.isLoadingRemoteTransactions) {
      return;
    }

    this.isLoadingRemoteTransactions = true;

    this.http
      .get<TransactionDto[]>(this.apiUrl)
      .pipe(
        catchError(() => of([])),
        finalize(() => {
          this.isLoadingRemoteTransactions = false;
          this.hasLoadedRemoteTransactions = true;
        }),
      )
      .subscribe((transactions) => {
        this.remoteTransactionsSubject.next(this.sortTransactions(transactions));
      });
  }

  private upsertRemoteTransaction(transaction: TransactionDto): void {
    const nextTransactions = this.sortTransactions([
      transaction,
      ...this.remoteTransactionsSubject.value.filter(
        (existingTransaction) => existingTransaction.id !== transaction.id,
      ),
    ]);

    this.remoteTransactionsSubject.next(nextTransactions);
  }

  private buildLocalTransaction(data: CreateTransactionEntryDto): TransactionDto {
    const timestamp = Date.now();
    const user = this.accountService.currentUser();
    const transactionId = -timestamp;

    return {
      id: transactionId,
      name: data.title.trim(),
      userId: user?.id || user?.email || 'local-user',
      imageKey: null,
      imagePreviewUrl: data.imagePreviewUrl ?? null,
      totalAmount: data.amount,
      transactionDate: new Date(`${data.transactionDate}T12:00:00`).toISOString(),
      status: 1,
      isAiEstimated: data.isAiEstimated ?? false,
      createdAt: new Date().toISOString(),
      note: data.note?.trim() || null,
      paymentMethod: data.paymentMethod?.trim() || null,
      source: data.source,
      transactionDetails: [
        {
          id: transactionId * 10,
          transactionId,
          categoryId: 0,
          categoryName: data.category?.trim() || null,
          itemName: data.title.trim(),
          price: data.amount,
          quantity: 1,
          unit: null,
          estimatedCalories: null,
        },
      ],
    };
  }

  private mergeTransactions(
    remoteTransactions: TransactionDto[],
    localTransactions: TransactionDto[],
  ): TransactionDto[] {
    const transactionsById = new Map<number, TransactionDto>();

    for (const transaction of [...localTransactions, ...remoteTransactions]) {
      transactionsById.set(transaction.id, transaction);
    }

    return Array.from(transactionsById.values());
  }

  private sortTransactions(transactions: TransactionDto[]): TransactionDto[] {
    return [...transactions].sort(
      (left, right) =>
        new Date(right.transactionDate).getTime() - new Date(left.transactionDate).getTime(),
    );
  }
}
