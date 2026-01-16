import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Toolbar } from "../../../modules/atomic/toolbar/toolbar/toolbar";
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { PrimeNGModules } from '../../../modules/primeng-modules';

@Component({
  selector: 'app-leitura',
  imports: [Toolbar, PrimeNGModules, CommonModule, RouterModule],
  templateUrl: './leitura.html',
  styleUrl: './leitura.css',
})
export class LeituraComponent implements OnInit {
  mangaId!: string;
  chapters: any[] = [];
  loading = true;
  error = false;
  mangaTitle: string = '';
  hasPortugueseChapters: boolean = false;
  hasEnglishChapters: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.mangaId = this.route.snapshot.paramMap.get('id')!;

    console.log('🔍 Manga ID da URL:', this.mangaId);

    if (!this.mangaId) {
      console.error('❌ Manga ID não encontrado na URL');
      this.setErrorState();
      return;
    }

    this.fetchMangaInfo();
  }

  private fetchMangaInfo(): void {
    const url = `https://api.mangadex.org/manga/${this.mangaId}`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        if (res.data && res.data.attributes) {
          const title = res.data.attributes.title;
          this.mangaTitle = title['en'] || title['pt-br'] || title['pt'] || Object.values(title)[0] || 'Mangá';
          console.log('✅ Manga encontrado:', this.mangaTitle);
          console.log('🌐 Idiomas disponíveis:', res.data.attributes.availableTranslatedLanguages);
        }
        this.loadChapters();
      },
      error: (err) => {
        console.error('❌ Erro ao buscar informações do mangá:', err);
        this.loadChapters();
      }
    });
  }

  loadChapters(): void {
    this.loading = true;
    this.error = false;
    this.cdRef.detectChanges();

    const url = 'https://api.mangadex.org/chapter';

    let params = new HttpParams()
      .set('manga', this.mangaId)
      .set('limit', '100')
      .set('offset', '0')
      .set('includes[]', 'scanlation_group')
      .set('order[chapter]', 'desc')
      .set('contentRating[]', 'safe')
      .set('contentRating[]', 'suggestive');

    params = params.append('translatedLanguage[]', 'pt');
    params = params.append('translatedLanguage[]', 'pt-br');

    console.log('🔍 Buscando capítulos em português...');

    this.http.get<any>(url, { params }).subscribe({
      next: (res) => {
        console.log('✅ Resposta da API (PT):', res);
        console.log('📊 Total na API:', res.total);
        console.log('📄 Capítulos recebidos:', res.data?.length || 0);

        if (res.data && res.data.length > 0) {
          this.processPortugueseChapters(res.data);
        } else {
          console.log('⚠️ Nenhum capítulo em português encontrado, buscando em inglês...');
          this.loadEnglishChapters();
          return;
        }

        this.finalizeLoading();
      },
      error: (err) => {
        console.error('❌ Erro na API:', err);
        this.loadEnglishChapters();
      },
    });
  }

  private processPortugueseChapters(chapterData: any[]): void {
    console.log('🎯 Processando capítulos em português...');

    const processedChapters = chapterData
      .map((c: any) => ({
        id: c.id,
        chapter: c.attributes.chapter || '?',
        title: c.attributes.title || 'Sem título',
        pages: c.attributes.pages || 0,
        language: c.attributes.translatedLanguage,
        publishAt: c.attributes.publishAt,
        volume: c.attributes.volume || null,
        scanlationGroup: this.getScanlationGroup(c.relationships)
      }))
      .filter((c: any) => c.chapter && c.chapter !== '?')
      .sort((a: any, b: any) => {
        const numA = parseFloat(a.chapter);
        const numB = parseFloat(b.chapter);
        return numB - numA;
      });

    this.chapters = processedChapters;
    this.hasPortugueseChapters = true;
    console.log(`✅ ${this.chapters.length} capítulos em português processados`);
  }

  private loadEnglishChapters(): void {
    console.log('🔍 Buscando capítulos em inglês...');

    const url = 'https://api.mangadex.org/chapter';

    let params = new HttpParams()
      .set('manga', this.mangaId)
      .set('limit', '100')
      .set('order[chapter]', 'desc')
      .set('translatedLanguage[]', 'en');

    this.http.get<any>(url, { params }).subscribe({
      next: (res) => {
        console.log('✅ Resposta (inglês):', res);

        if (res.data && res.data.length > 0) {
          this.processEnglishChapters(res.data);
        } else {
          this.chapters = [];
          console.warn('⚠️ Nenhum capítulo encontrado em nenhum idioma');
        }

        this.finalizeLoading();
      },
      error: (err) => {
        console.error('❌ Erro no fallback inglês:', err);
        this.setErrorState();
      }
    });
  }

  private processEnglishChapters(chapterData: any[]): void {
    console.log('🎯 Processando capítulos em inglês...');

    const processedChapters = chapterData
      .map((c: any) => ({
        id: c.id,
        chapter: c.attributes.chapter || '?',
        title: c.attributes.title || 'Sem título',
        pages: c.attributes.pages || 0,
        language: c.attributes.translatedLanguage,
        publishAt: c.attributes.publishAt,
        volume: c.attributes.volume || null,
        scanlationGroup: this.getScanlationGroup(c.relationships),
        note: this.hasPortugueseChapters ? '(Inglês)' : ''
      }))
      .filter((c: any) => c.chapter && c.chapter !== '?')
      .sort((a: any, b: any) => {
        const numA = parseFloat(a.chapter);
        const numB = parseFloat(b.chapter);
        return numB - numA;
      });

    if (this.hasPortugueseChapters) {
      this.chapters = [...this.chapters, ...processedChapters];
    } else {
      this.chapters = processedChapters;
    }

    this.hasEnglishChapters = processedChapters.length > 0;
    console.log(`✅ ${processedChapters.length} capítulos em inglês adicionados`);
  }

  private getScanlationGroup(relationships: any[]): string {
    if (!relationships) return 'Desconhecido';

    const group = relationships.find((r: any) => r.type === 'scanlation_group');
    if (group && group.attributes && group.attributes.name) {
      return group.attributes.name;
    }
    return 'Desconhecido';
  }

  private finalizeLoading(): void {
    this.loading = false;

    if (this.chapters.length > 0) {
      this.chapters.sort((a: any, b: any) => {
        const numA = parseFloat(a.chapter);
        const numB = parseFloat(b.chapter);
        return numB - numA;
      });
    }

    this.hasEnglishChapters = this.chapters.some(c => c.language === 'en');

    this.cdRef.detectChanges();

    const ptCount = this.chapters.filter(c => c.language.includes('pt')).length;
    const enCount = this.chapters.filter(c => c.language === 'en').length;

    console.log('🎉 Carregamento finalizado!');
    console.log(`📚 Total: ${this.chapters.length} capítulos`);
    console.log(`🇧🇷 Português: ${ptCount} capítulos`);
    console.log(`🇺🇸 Inglês: ${enCount} capítulos`);
  }

  private setErrorState(): void {
    this.error = true;
    this.loading = false;
    this.cdRef.detectChanges();
    console.error('❌ Estado de erro ativado');
  }

  retryLoad(): void {
    console.log('🔄 Tentando novamente...');
    this.error = false;
    this.chapters = [];
    this.hasPortugueseChapters = false;
    this.hasEnglishChapters = false;
    this.loadChapters();
  }

  lerCapitulo(capitulo: any): void {
  console.log('📖 Capítulo selecionado:', capitulo.id, `Cap. ${capitulo.chapter}`);

  // Navega para a rota leitor com o ID do capítulo
  this.router.navigate(['/leitor', capitulo.id]);
}

  formatDate(dateString: string): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return dateString;
    }
  }

  forceEnglishSearch(): void {
    console.log('🔍 Forçando busca em inglês...');
    this.loading = true;
    this.error = false;
    this.cdRef.detectChanges();
    this.loadEnglishChapters();
  }
}
