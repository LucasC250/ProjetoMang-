import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Toolbar } from '../../../modules/atomic/toolbar/toolbar/toolbar';
import { PrimeNGModules } from '../../../modules/primeng-modules';

@Component({
  selector: 'app-politica-privacidade',
  standalone: true,
  imports: [Toolbar, ...PrimeNGModules],
  templateUrl: './politica-privacidade.html',
  styleUrl: './politica-privacidade.css',
})
export class PoliticaPrivacidade {

  constructor(private router: Router) {}

  changePageRoute(route: string) {
    this.router.navigate([route]);
  }
}
