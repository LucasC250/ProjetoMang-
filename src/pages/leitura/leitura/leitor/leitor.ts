import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Toolbar } from "../../../../modules/atomic/toolbar/toolbar/toolbar";
import { PrimeNGModules } from '../../../../modules/primeng-modules';

@Component({
  selector: 'app-leitor',
  imports: [PrimeNGModules, Toolbar, CommonModule],
  templateUrl: './leitor.html',
  styleUrl: './leitor.css',
})
export class LeitorComponent implements OnInit, OnDestroy {
  chapterId!: string;
  pages: string[] = [];
  currentPage = 0;
  loading = true;
  error = false;
  errorMessage = '';
  mangaTitle = '';
  chapterInfo: any = null;
  alternativeSources: any[] = [];
  tryingAlternatives = false;
  hasExternalUrl = false;
  externalUrl = '';
  redirectTimer: any = null;
  redirectCountdown = 5; // Segundos para redirecionamento automático

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chapterId = this.route.snapshot.paramMap.get('id')!;

    if (!this.chapterId) {
      this.showError('ID do capítulo não encontrado');
      return;
    }

    console.log('🔍 Carregando capítulo:', this.chapterId);
    this.loadChapter();
  }

  ngOnDestroy(): void {
    // Limpa o timer se o componente for destruído
    if (this.redirectTimer) {
      clearInterval(this.redirectTimer);
    }
  }

  loadChapter(): void {
    this.loading = true;
    this.error = false;
    this.cdRef.detectChanges();

    // Primeiro busca informações do capítulo
    const chapterUrl = `https://api.mangadex.org/chapter/${this.chapterId}`;

    this.http.get<any>(chapterUrl).subscribe({
      next: (chapterRes) => {
        if (chapterRes.result === 'ok') {
          this.chapterInfo = chapterRes.data;
          console.log('✅ Informações do capítulo:', this.chapterInfo);

          // Verifica se tem URL externa
          if (this.chapterInfo?.attributes?.externalUrl) {
            this.externalUrl = this.chapterInfo.attributes.externalUrl;
            this.hasExternalUrl = true;
            console.log('🔗 URL Externa encontrada:', this.externalUrl);
          }

          // Extrai título do mangá
          this.extractMangaTitle();

          // Tenta buscar as páginas
          this.fetchPages();
        } else {
          this.showError('Capítulo não encontrado na MangaDex');
        }
      },
      error: (err) => {
        console.error('❌ Erro ao buscar informações do capítulo:', err);
        this.showError('Erro ao buscar informações do capítulo');
      }
    });
  }

  private extractMangaTitle(): void {
    if (this.chapterInfo?.relationships) {
      const mangaRel = this.chapterInfo.relationships.find((r: any) => r.type === 'manga');
      if (mangaRel) {
        const titleObj = mangaRel.attributes?.title || {};
        this.mangaTitle = titleObj['en'] ||
                         titleObj['pt-br'] ||
                         titleObj['pt'] ||
                         Object.values(titleObj)[0] ||
                         'Mangá';
      }
    }
  }

  private fetchPages(): void {
    const pagesUrl = `https://api.mangadex.org/at-home/server/${this.chapterId}`;

    this.http.get<any>(pagesUrl).subscribe({
      next: (res) => {
        console.log('✅ Servidor de páginas:', res);

        if (res.result === 'ok') {
          // Tenta usar data (alta qualidade) primeiro
          if (res.chapter.data && res.chapter.data.length > 0) {
            this.pages = res.chapter.data.map((page: string) =>
              `${res.baseUrl}/data/${res.chapter.hash}/${page}`
            );
            console.log(`📄 ${this.pages.length} páginas em alta qualidade`);
            this.loading = false;
            this.cdRef.detectChanges();
            return;
          }

          // Se não tiver data, tenta dataSaver (baixa qualidade)
          if (res.chapter.dataSaver && res.chapter.dataSaver.length > 0) {
            this.pages = res.chapter.dataSaver.map((page: string) =>
              `${res.baseUrl}/data-saver/${res.chapter.hash}/${page}`
            );
            console.log(`📄 ${this.pages.length} páginas em qualidade reduzida`);
            this.loading = false;
            this.cdRef.detectChanges();
            return;
          }

          // Se ambas estiverem vazias
          console.warn('⚠️ Nenhuma página disponível no servidor principal');

          // Se tem URL externa, prepara redirecionamento
          if (this.hasExternalUrl && this.externalUrl) {
            this.prepareExternalRedirect();
          } else {
            // Tenta fontes alternativas
            this.tryAlternativeSources();
          }

        } else {
          this.showError('Não foi possível acessar o servidor de páginas');
        }
      },
      error: (err) => {
        console.error('❌ Erro ao buscar páginas:', err);
        if (this.hasExternalUrl && this.externalUrl) {
          this.prepareExternalRedirect();
        } else {
          this.tryAlternativeSources();
        }
      }
    });
  }

  private prepareExternalRedirect(): void {
    console.log('🔄 Preparando redirecionamento para URL externa...');

    // Inicia contagem regressiva para redirecionamento automático
    this.startRedirectCountdown();

    this.loading = false;
    this.error = true;
    this.errorMessage = `Este capítulo está disponível no site oficial. Você será redirecionado automaticamente em ${this.redirectCountdown} segundos...`;

    // Também busca outras alternativas para mostrar
    this.searchAggregators();

    this.cdRef.detectChanges();
  }

  private startRedirectCountdown(): void {
    this.redirectTimer = setInterval(() => {
      this.redirectCountdown--;
      this.errorMessage = `Este capítulo está disponível no site oficial. Você será redirecionado automaticamente em ${this.redirectCountdown} segundos...`;
      this.cdRef.detectChanges();

      if (this.redirectCountdown <= 0) {
        clearInterval(this.redirectTimer);
        this.redirectToExternal();
      }
    }, 1000);
  }

  private tryAlternativeSources(): void {
    console.log('🔄 Tentando fontes alternativas...');
    this.tryingAlternatives = true;

    // Busca agregadores
    this.searchAggregators();

    // Mostra estado
    this.loading = false;
    this.error = true;
    this.errorMessage = 'Este capítulo não está disponível para leitura no momento.';

    if (this.alternativeSources.length > 0) {
      this.errorMessage += ' Você pode tentar as seguintes alternativas:';
    }

    this.cdRef.detectChanges();
  }

  private searchAggregators(): void {
    if (!this.chapterInfo) return;

    const chapterNumber = this.chapterInfo.attributes.chapter;
    const mangaTitle = this.mangaTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Gera URLs para agregadores populares
    const aggregators = [
      {
        name: 'MangaDex (Website)',
        url: `https://mangadex.org/chapter/${this.chapterId}`,
        type: 'direct'
      },
      {
        name: 'MangaSee',
        url: `https://mangasee123.com/search/?sort=s&desc=true&name=${encodeURIComponent(this.mangaTitle)}`,
        type: 'search'
      },
      {
        name: 'Comick',
        url: `https://comick.app/search?q=${encodeURIComponent(this.mangaTitle)}`,
        type: 'search'
      }
    ];

    this.alternativeSources.push(...aggregators);
    console.log('🔍 Fontes alternativas sugeridas:', aggregators);
  }

  private showError(message: string): void {
    this.error = true;
    this.errorMessage = message;
    this.loading = false;
    this.cdRef.detectChanges();
    console.error('❌ Erro:', message);
  }

  // Redireciona para URL externa
  redirectToExternal(): void {
    if (this.externalUrl) {
      console.log('🚀 Redirecionando para:', this.externalUrl);
      window.open(this.externalUrl, '_blank');

      // Volta para lista de capítulos após um breve delay
      setTimeout(() => {
        this.voltarParaCapitulos();
      }, 2000);
    }
  }

  // Redireciona imediatamente (chamado pelo botão)
  redirectNow(): void {
    if (this.redirectTimer) {
      clearInterval(this.redirectTimer);
    }
    this.redirectToExternal();
  }

  nextPage(): void {
    if (this.currentPage < this.pages.length - 1) {
      this.currentPage++;
      this.scrollToTop();
    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.scrollToTop();
    }
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.pages.length) {
      this.currentPage = page;
      this.scrollToTop();
    }
  }

  getChapterTitle(): string {
    if (this.chapterInfo) {
      const chapterNum = this.chapterInfo.attributes.chapter || '?';
      const title = this.chapterInfo.attributes.title || '';
      return `Capítulo ${chapterNum}${title ? ': ' + title : ''}`;
    }
    return 'Carregando...';
  }

  retryLoad(): void {
    if (this.redirectTimer) {
      clearInterval(this.redirectTimer);
    }
    this.error = false;
    this.loading = true;
    this.pages = [];
    this.currentPage = 0;
    this.alternativeSources = [];
    this.tryingAlternatives = false;
    this.redirectCountdown = 5;
    this.cdRef.detectChanges();
    this.loadChapter();
  }

  voltarParaCapitulos(): void {
    // Tenta obter o mangaId das relações
    if (this.chapterInfo && this.chapterInfo.relationships) {
      const manga = this.chapterInfo.relationships.find((r: any) => r.type === 'manga');
      if (manga && manga.id) {
        this.router.navigate(['/ler', manga.id]);
        return;
      }
    }

    // Fallback: voltar para a página anterior
    window.history.back();
  }

  openAlternativeSource(source: any): void {
    if (source.url) {
      window.open(source.url, '_blank');
    }
  }

  copyChapterInfo(): void {
    const info = `Capítulo: ${this.getChapterTitle()}\nID: ${this.chapterId}\nURL Externa: ${this.externalUrl || 'Não disponível'}`;
    navigator.clipboard.writeText(info).then(() => {
      // Mostra feedback visual
      alert('Informações do capítulo copiadas para a área de transferência!');
    });
  }

  cancelRedirect(): void {
    if (this.redirectTimer) {
      clearInterval(this.redirectTimer);
      this.errorMessage = 'Redirecionamento cancelado. Você pode acessar manualmente usando os botões abaixo.';
      this.cdRef.detectChanges();
    }
  }
}
