import { Routes } from '@angular/router';
import { UserPage } from './user-page/user-page';
import { authGuard } from './core/_guard/auth-guard';
import { Register } from './features/account/register/register';
import { Login } from './features/account/login/login';


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
            
        ]
    },
    
    { path: 'dang-nhap', component: Login },
    { path: 'dang-ky', component: Register },
];
