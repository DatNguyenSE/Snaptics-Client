import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs';
import { ToastService } from '../services/toast-service';
import { SystemStatusService } from '../services/system-status.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const router = inject(Router);
  const systemStatusService = inject(SystemStatusService);

  return next(req).pipe(
    catchError(error => {
      if (error) {
        // Intercept Maintenance Mode (503 Service Unavailable or 423 Locked or payload flag)
        if (
          error.status === 503 ||
          error.status === 423 ||
          (error.error && (error.error.isMaintenance || error.error.maintenanceMode))
        ) {
          systemStatusService.status.set({
            maintenanceMode: true,
            title: error.error?.title || 'Hệ thống đang được bảo trì',
            message: error.error?.message || 'Hệ thống đang trong quá trình bảo trì nâng cấp. Vui lòng quay lại sau.',
            showSupportButton: true,
          });
          void router.navigateByUrl('/maintenance');
          throw error;
        }

        switch (error.status) {
         case 400:
            if (error.error.errors) {
              const modelStateErrors = [];
              for (const key in error.error.errors) {
                if (error.error.errors[key]) {
                  modelStateErrors.push(error.error.errors[key]);
                }
              }
              const errorMessage = modelStateErrors.flat().join('\n'); 
              console.log('Model state errors:', errorMessage);
              throw modelStateErrors.flat(); 
            } else if (typeof(error.error) === 'object') {
               console.log('Error object from server:', error.error);
            } else {
                console.log('Error string from server:', error.error);
            }
            break;
          case 401:
            console.log('Unauthorized - ', error.error);
            break;
          case 404:
            console.log('Resource not found:', req.urlWithParams);
            break;
          case 500:
            console.log('Internal Server Error: ', error.error);
            break;
          default:
           console.log('Lỗi hệ thống - Vui lòng thử lại sau');
            break;
        }
      }

      throw error;
    })
  );
};
