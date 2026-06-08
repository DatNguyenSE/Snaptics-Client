import { Routes } from '@angular/router';
import { UserPage } from './user-page/user-page';
import { authGuard } from './core/_guard/auth-guard';
<<<<<<< HEAD
import { Login } from './features/login/login';
=======
import { Login } from './user-page/features/login/login';
import { Register } from './user-page/features/register/register';
>>>>>>> 52ccd6669ea9528fcdbd99556303f4a3e2f9d281

// Đây là file định nghĩa các route trong ứng dụng, mỗi route sẽ ánh xạ đến một component tương ứng
// Các route được chia thành 2 nhóm: route cần auth (đăng nhập) và route public (đăng nhập, đăng ký)
// Route cần auth sẽ được bảo vệ bởi authGuard, nếu user chưa đăng nhập thì sẽ bị chuyển hướng sang trang đăng nhập
export const routes: Routes = [
    {
        path: '',
        redirectTo: 'trang-chu',
        pathMatch: 'full'
    },
    {
        path: 'trang-chu',
        component: UserPage, 
        runGuardsAndResolvers: 'always',
        canActivate: [authGuard],
        children: [
<<<<<<< HEAD
            
=======
            {   path: 'trang-chu', redirectTo: 'UserPage', pathMatch: 'full' },  
            { path: 'UserPage', component: UserPage   },
>>>>>>> 52ccd6669ea9528fcdbd99556303f4a3e2f9d281
        ]
    },
    
    { path: 'dang-nhap', component: Login },
    { path: 'dang-ky', component: Register },
];
