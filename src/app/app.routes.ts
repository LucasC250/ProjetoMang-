import { Routes } from '@angular/router';
import { HomeComponent } from '../pages/home/home.component';
import { LoginComponent } from '../pages/home/login/login.component';
import { Contato } from '../pages/contato/contato/contato';
import { TermosUso } from '../pages/termosUso/termos-uso/termos-uso';
import { PoliticaPrivacidade } from '../pages/politicaPrivacidade/politica-privacidade/politica-privacidade';
import { LeituraComponent } from '../pages/leitura/leitura/leitura';
import { LeitorComponent } from '../pages/leitura/leitura/leitor/leitor';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'contato', component: Contato },
  { path: 'privacidade', component: PoliticaPrivacidade },
  { path: 'termos', component: TermosUso },
  { path: 'ler/:id', component: LeituraComponent },
  { path: 'leitor/:id', component: LeitorComponent },
];
