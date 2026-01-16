import { Component } from '@angular/core';
import { Toolbar } from "../../../modules/atomic/toolbar/toolbar/toolbar";
import { PrimeNGModules } from '../../../modules/primeng-modules';

@Component({
  selector: 'app-termos-uso',
  imports: [Toolbar, PrimeNGModules],
  templateUrl: './termos-uso.html',
  styleUrl: './termos-uso.css',
})
export class TermosUso {
 router: any;
 changePageRoute(route: string) {
    this.router.navigate([route]);
  }

}
