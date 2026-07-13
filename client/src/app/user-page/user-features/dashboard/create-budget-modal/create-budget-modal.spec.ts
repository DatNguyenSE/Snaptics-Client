import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateBudgetModal } from './create-budget-modal';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { LanguageService } from '../../../../core/services/language-service';
import { CategoryService } from '../../../../core/services/category.service';
import { BudgetService } from '../../../../core/services/budget.service';
import { ToastService } from '../../../../core/services/toast-service';

describe('CreateBudgetModal', () => {
  let component: CreateBudgetModal;
  let fixture: ComponentFixture<CreateBudgetModal>;
  let mockLanguageService: any;
  let mockCategoryService: any;
  let mockBudgetService: any;
  let mockToastService: any;

  beforeEach(async () => {
    mockLanguageService = {
      t: jasmine.createSpy('t').and.callFake((key: string) => key),
      locale: jasmine.createSpy('locale').and.returnValue('vi'),
    };
    mockCategoryService = {
      getCategories: jasmine.createSpy('getCategories').and.returnValue(of([])),
    };
    mockBudgetService = {
      createBudget: jasmine.createSpy('createBudget').and.returnValue(of({ id: 1, name: 'Test' })),
      getBudgets: jasmine.createSpy('getBudgets').and.returnValue(of([])),
    };
    mockToastService = {
      success: jasmine.createSpy('success'),
      error: jasmine.createSpy('error'),
    };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, CreateBudgetModal],
      providers: [
        { provide: LanguageService, useValue: mockLanguageService },
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: BudgetService, useValue: mockBudgetService },
        { provide: ToastService, useValue: mockToastService },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateBudgetModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should invalidate form when required fields are missing', () => {
    component.form.setValue({
      name: '',
      amount: null,
      period: 'MONTHLY',
      startDate: '',
      endDate: '',
      categoryId: null,
      note: ''
    });
    expect(component.form.valid).toBeFalse();

    component.onSubmit();
    expect(mockBudgetService.createBudget).not.toHaveBeenCalled();
  });

  it('should show error when amount is <= 0', () => {
    component.form.setValue({
      name: 'Test Budget',
      amount: 0,
      period: 'MONTHLY',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      categoryId: null,
      note: ''
    });
    expect(component.form.valid).toBeFalse();
  });

  it('should validate endDate >= startDate when period is CUSTOM', () => {
    component.form.setValue({
      name: 'Test Budget',
      amount: 1000,
      period: 'CUSTOM',
      startDate: '2026-07-10',
      endDate: '2026-07-05',
      categoryId: null,
      note: ''
    });
    component.form.controls.endDate.markAsDirty();
    component.form.controls.endDate.markAsTouched();
    fixture.detectChanges();
    expect(component.form.valid).toBeFalse();
    expect(component.formRangeError).toBeTruthy();
  });

  it('should submit correct payload and emit success on API success', () => {
    const emitSpy = spyOn(component.budgetCreated, 'emit');
    const closeSpy = spyOn(component.closeModal, 'emit');

    component.form.setValue({
      name: 'Test Budget',
      amount: 5000000,
      period: 'MONTHLY',
      startDate: '2026-07-01',
      endDate: '2026-07-01',
      categoryId: null,
      note: 'Hello note'
    });

    expect(component.form.valid).toBeTrue();
    component.onSubmit();

    expect(mockBudgetService.createBudget).toHaveBeenCalledWith({
      name: 'Test Budget',
      amount: 5000000,
      period: 'MONTHLY',
      startDate: '2026-07-01',
      endDate: '2026-07-01',
      categoryId: null,
      note: 'Hello note'
    });

    expect(emitSpy).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should display loading state during submit and keep modal open on API failure', () => {
    mockBudgetService.createBudget.and.returnValue(throwError(() => new Error('API Error')));
    const emitSpy = spyOn(component.budgetCreated, 'emit');
    const closeSpy = spyOn(component.closeModal, 'emit');

    component.form.setValue({
      name: 'Failed Budget',
      amount: 5000000,
      period: 'MONTHLY',
      startDate: '2026-07-01',
      endDate: '2026-07-01',
      categoryId: null,
      note: ''
    });

    component.onSubmit();

    expect(mockBudgetService.createBudget).toHaveBeenCalled();
    expect(emitSpy).not.toHaveBeenCalled();
    expect(closeSpy).not.toHaveBeenCalled();
    expect(component.isSubmitting).toBeFalse();
    expect(mockToastService.error).toHaveBeenCalled();
  });
});
