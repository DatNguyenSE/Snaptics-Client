import { Routes } from '@angular/router';
import { App } from './app';
import { UserPage } from './user-page/user-page';
import { authGuard } from './core/_guard/auth-guard';
import { Login } from './features/login/login';

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
];
