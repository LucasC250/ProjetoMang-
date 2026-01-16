import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PrimeNGModules } from '../../../primeng-modules';

@Component({
  standalone: true, // 🔥 ESSENCIAL
  selector: 'app-toolbar',
  imports: [...PrimeNGModules],
  templateUrl: './toolbar.html',
  styleUrls: ['./toolbar.css'], // plural
})
export class Toolbar {

  constructor(private router: Router) {}

  changePageRoute(route: string) {
    this.router.navigate([route]);
  }
}
