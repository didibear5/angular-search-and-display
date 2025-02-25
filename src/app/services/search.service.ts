import { Injectable, inject, Inject, InjectionToken } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

interface SearchConfig {
  defaultPageSize?: number;
}

export interface CurrentSearch {
  searchText: string;
  pageSize: number;
  page: number;
}

export interface SearchResult {
  num_found: number;
  docs: {
    title: string;
    author_name: string[];
    cover_edition_key: string;
  }[];
}

export interface ISearchService {
  searchText: string;
  pageSize: number;
  page: number;
  currentSearch$: BehaviorSubject<CurrentSearch | null>;
  submit(): void;
}

// BONUS: Use DI to update the config of SearchService to update page size
export const SEARCH_CONFIG: InjectionToken<SearchConfig> = new InjectionToken<SearchConfig>('SearchConfig');

@Injectable()
export class SearchService implements ISearchService {
  private $http = inject(HttpClient);

  searchText: string = '';
  pageSize: number;
  page: number = 1;
  currentSearch$ = new BehaviorSubject<CurrentSearch | null>(null);
  isLoading: boolean = false;
  
  constructor(
    @Inject(SEARCH_CONFIG) searchConfig: SearchConfig,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.pageSize = searchConfig.defaultPageSize || 10;
    this._initFromUrl(searchConfig)
  }

  // BONUS: Keep the current search params in the URL that allow users to refresh the page and search again
  private _initFromUrl(searchConfig: SearchConfig) {
    this.route.queryParams.subscribe((params) => {
      if (Object.keys(params).length === 0) return;

      this.searchText =  params['searchText'] || this.searchText;
      this.pageSize = Number(params['pageSize']) || searchConfig.defaultPageSize || this.pageSize;
      this.page = Number(params['page']) || this.page;
  
      this.currentSearch$.next({
        searchText: this.searchText,
        pageSize: this.pageSize,
        page: this.page,
      });
    });
  }

  submit() {
    if (!this.searchText) return alert('Search text cannot be empty!');
   
    const search = {
      searchText: this.searchText,
      pageSize: this.pageSize,
      page: this.page,
    }
    this.router.navigate([], {
      queryParams: search,
      queryParamsHandling: 'merge',
    });
  }

  searchBooks(currentSearch: CurrentSearch): Observable<SearchResult> {
    const { searchText, pageSize, page } = currentSearch;

    this.isLoading = true;

    const searchQuery = searchText.split(' ').join('+').toLowerCase();
    return this.$http.get<SearchResult>(
      `https://openlibrary.org/search.json?q=${searchQuery}&page=${page}&limit=${pageSize}`
    ).pipe(
      tap(() => {
        this.isLoading = false;
      }),
      catchError((error) => {
        this.isLoading = false;
        console.error('Search error: ', error);
        alert('An unexpected error occurred!');
        return of({ num_found: 0, docs: [] });
      })
    )
  }
}
