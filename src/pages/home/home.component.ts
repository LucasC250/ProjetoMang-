import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PrimeNGModules } from '../../modules/primeng-modules';
import { Toolbar } from '../../modules/atomic/toolbar/toolbar/toolbar';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  imports: [CommonModule, ...PrimeNGModules, Toolbar],
})
export class HomeComponent implements OnInit, OnDestroy {
  // ===== Carrossel =====
  images = [
    '/assets/advertisement/img0.png',
    '/assets/advertisement/img1.png',
    '/assets/advertisement/img2.png',
    '/assets/advertisement/img3.png',
    '/assets/advertisement/img4.png',
    '/assets/advertisement/img5.png',
  ];
  currentIndex = 0;
  intervalId: any;

  // ===== Mangás =====
  mangas: any[] = [];
  loading = false;

  // ===== Paginação =====
  page = 0;
  limit = 20;
  totalRecords = 0;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.startCarousel();
    this.loadMangasFromMangaDex();
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  // =============================
  // Paginação
  // =============================
  onPageChange(event: any): void {
    this.page = event.page;
    this.loadMangasFromMangaDex();
  }

  // =============================
  // Navegação
  // =============================
  lerManga(manga: any): void {
    this.router.navigate(['/ler', manga.id]);
  }

  // =============================
  // Carrossel
  // =============================
  startCarousel(): void {
    this.intervalId = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
      // NÃO chamar detectChanges() aqui
    }, 3000);
  }

  get currentImage(): string {
    return this.images[this.currentIndex];
  }

  // =============================
  // API MangaDex
  // =============================
  loadMangasFromMangaDex(): void {
    this.loading = true;
    // Marcar para verificação
    this.cdr.markForCheck();

    const offset = this.page * this.limit;

    const url = 'https://api.mangadex.org/manga';
    const params = {
      limit: this.limit.toString(),
      offset: offset.toString(),
      'order[followedCount]': 'desc',
      'contentRating[]': 'safe',
      'includes[]': 'cover_art',
      'availableTranslatedLanguage[]': 'pt',
    };

    this.http.get<any>(url, { params }).subscribe({
      next: (response) => {
        this.mangas = this.processMangaDexData(response.data);
        this.totalRecords = response.total;
        this.loading = false;
        // Marcar para verificação
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        // Marcar para verificação
        this.cdr.markForCheck();
      },
    });
  }

  processMangaDexData(data: any[]): any[] {
    return data.map((manga: any) => {
      const title =
        manga.attributes.title.en ||
        manga.attributes.title['ja-ro'] ||
        Object.values(manga.attributes.title)[0] ||
        'Título desconhecido';

      let image = 'assets/images/default-manga.jpg';
      const cover = manga.relationships?.find((r: any) => r.type === 'cover_art');
      if (cover?.attributes?.fileName) {
        image = `https://uploads.mangadex.org/covers/${manga.id}/${cover.attributes.fileName}.256.jpg`;
      }

      return {
        id: manga.id,
        title,
        image,
        author: 'Autor desconhecido',
        score: this.getRandomScore(),
        chapters: manga.attributes.lastChapter || '?',
      };
    });
  }

  getRandomScore(): number {
    return parseFloat((Math.random() * 2 + 7).toFixed(1));
  }

  getScore(manga: any): string {
    return manga.score?.toFixed(1) ?? 'N/A';
  }
}
