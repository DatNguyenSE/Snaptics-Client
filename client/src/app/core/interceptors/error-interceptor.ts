import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs';
import { ToastService } from '../services/toast-service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError(error => {
      if (error) {
        switch (error.status) {
         case 400:
            // XỬ LÝ LỖI IDENTITY TẠI ĐÂY
            if (error.error.errors) {
              const modelStateErrors = [];
              for (const key in error.error.errors) {
                if (error.error.errors[key]) {
                  modelStateErrors.push(error.error.errors[key]);
                }
              }
              // Nối các lỗi lại và hiện Toast
              // flat() dùng để làm phẳng mảng nếu lỗi lồng nhau
              const errorMessage = modelStateErrors.flat().join('\n'); 
              // toast.error(errorMessage);
                console.log('Model state errors:', errorMessage);
              
              // Vẫn ném lỗi về component để component biết mà dừng loading
              throw modelStateErrors.flat(); 
            } else if (typeof(error.error) === 'object') {
              //  toast.error(error.error.message || "Bad Request", error.status.toString());
               console.log('Error object from server:', error.error);
            } else {
               // Lỗi trả về dạng chuỗi đơn giản (return BadRequest("..."))
              //  toast.error(error.error, error.status.toString());
                console.log('Error string from server:', error.error);
            }
            break;
          case 401:
            console.log('Unauthorized - ', error.error);
            // toast.error('Unauthorized - '+ error.error+'');
            break;
          case 404:
            console.log('Resource not found:', req.urlWithParams);
            break;
          case 500:
            console.log('Internal Server Error: ', error.error);
            if (toast) {
                // toast.error('Lỗi hệ thống từ máy chủ (500)'); 
            }
            break;
          default:
           console.log('Lỗi hệ thống - Vui lòng thử lại sau');
            break;
        }
      }

      throw error;
    })
  )
};
