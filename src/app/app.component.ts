import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { filter, Observable, switchMap, shareReplay } from 'rxjs';
import { CurrentSearch, SearchResult, SearchService, SEARCH_CONFIG } from './services/search.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatPaginatorModule,
  ],
  providers: [
    SearchService,
    {
      provide: SEARCH_CONFIG,
      useValue: {
        defaultPageSize: 10,
      },
    },
  ],
  // BONUS: Use DI to update the config of SearchService to update page size
})
export class AppComponent {
  // TODO: Create a SearchService and use DI to inject it
  // Check app/services/search.service.ts for the implementation
  public $search = inject(SearchService);

  // TODO: Implement this observable to call the searchBooks() function
  // Hint: Use RxJS operators to solve these issues
  searchResults$: Observable<SearchResult> = this.$search.currentSearch$.pipe(
    filter(
      (search): search is CurrentSearch =>
        !!search && search.searchText.trim() !== ''
    ),
    switchMap((currentSearch) => this.$search.searchBooks(currentSearch)),
    shareReplay(1)
  )

  onSearchInputChange(event: Event) {
    this.$search.searchText = (event.target as HTMLInputElement).value;
  }

  onSearchClick() {
    this.$search.page = 1;

    this.$search.submit();
  }

  onPageChange(event: PageEvent) {
    this.$search.pageSize = event.pageSize;
    this.$search.page = event.pageIndex + 1;

    this.$search.submit();
  }
}
