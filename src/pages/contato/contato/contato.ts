import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Toolbar } from '../../../modules/atomic/toolbar/toolbar/toolbar';
import { PrimeNGModules } from '../../../modules/primeng-modules';

@Component({
  standalone: true, // 🔥 ESSENCIAL
  selector: 'app-contato',
  imports: [Toolbar, PrimeNGModules],
  templateUrl: './contato.html',
  styleUrls: ['./contato.css'], // 🔥 plural
})
export class Contato {

  constructor(private router: Router) {}

  changePageRoute(route: string) {
    this.router.navigate([route]);
  }

}
