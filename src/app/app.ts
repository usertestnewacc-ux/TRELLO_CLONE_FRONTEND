import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { WorkspaceService } from './workspace.service';
import { BoardService } from './board.service';
import { CardService } from './card.service';
import { ListService } from './list.service';
import { Workspace } from './workspace.types';
import { Board } from './board.types';
import { CardItem } from './card.types';
import { ListItem } from './list.types';

type SearchResultType = 'workspace' | 'board' | 'card';

interface SearchResult {
  type: SearchResultType;
  id: string;
  name: string;
  subTitle: string;
  boardId?: string; // for card → navigate to that board
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NgIf, NgFor, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly boardService = inject(BoardService);
  private readonly cardService = inject(CardService);
  private readonly listService = inject(ListService);
  private readonly router = inject(Router);
  protected readonly title = signal('trelloui');

  showProfileMenu = signal(false);
  showAppSwitcher = signal(false);
  showCreateMenu = signal(false);

  // Search
  searchQuery = signal('');
  searchResults = signal<SearchResult[]>([]);
  showSearchResults = signal(false);
  isSearching = signal(false);

  allWorkspaces: Workspace[] = [];
  allBoards: Board[] = [];
  allCards: CardItem[] = [];
  allLists: ListItem[] = [];

  private searchDataLoaded = false;

  constructor() {
    // Reload search data whenever auth state changes (login/logout)
    effect(() => {
      const isAuth = this.authService.isAuthenticated();
      if (isAuth && !this.searchDataLoaded) {
        this.loadSearchData();
      } else if (!isAuth) {
        this.searchDataLoaded = false;
        this.allWorkspaces = [];
        this.allBoards = [];
        this.allCards = [];
        this.allLists = [];
        this.clearSearch();
      }
    });
  }

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.loadSearchData();
    }
  }

  async loadSearchData() {
    if (this.searchDataLoaded) return;
    try {
      this.isSearching.set(true);
      const [workspaces, boards, cards, lists] = await Promise.allSettled([
        this.workspaceService.getWorkspaces(),
        this.boardService.getBoards(),
        this.cardService.getAllCards(),
        this.listService.getAllLists()
      ]);
      this.allWorkspaces = workspaces.status === 'fulfilled' ? workspaces.value : [];
      this.allBoards    = boards.status    === 'fulfilled' ? boards.value    : [];
      this.allCards     = cards.status     === 'fulfilled' ? cards.value     : [];
      this.allLists     = lists.status     === 'fulfilled' ? lists.value     : [];
      this.searchDataLoaded = true;
    } catch {
      // fail silently
    } finally {
      this.isSearching.set(false);
    }
  }

  /** Force refresh search data (called after CRUD ops) */
  async refreshSearchData() {
    this.searchDataLoaded = false;
    await this.loadSearchData();
  }

  onSearchInput(query: string) {
    this.searchQuery.set(query);
    if (!query.trim()) {
      this.searchResults.set([]);
      this.showSearchResults.set(false);
      return;
    }
    const q = query.toLowerCase();
    const results: SearchResult[] = [];

    // Search workspaces
    for (const ws of this.allWorkspaces) {
      if (ws.name.toLowerCase().includes(q) ||
          (ws.description ?? '').toLowerCase().includes(q)) {
        results.push({
          type: 'workspace',
          id: ws.id,
          name: ws.name,
          subTitle: 'Workspace'
        });
      }
    }

    // Search boards
    for (const board of this.allBoards) {
      if (board.name.toLowerCase().includes(q) ||
          (board.description ?? '').toLowerCase().includes(q)) {
        const wsName = this.allWorkspaces.find(w => w.id === board.workspaceId)?.name ?? 'Workspace';
        results.push({
          type: 'board',
          id: board.id,
          name: board.name,
          subTitle: wsName
        });
      }
    }

    // Search cards — resolve board via list
    for (const card of this.allCards) {
      if (card.title.toLowerCase().includes(q) ||
          (card.description ?? '').toLowerCase().includes(q)) {
        // Map card → list → board
        const list = this.allLists.find(l => l.id === card.listId);
        const board = list ? this.allBoards.find(b => b.id === list.boardId) : undefined;
        const boardName = board?.name ?? '';
        const listName  = list?.title ?? '';
        const subParts  = ['Card'];
        if (boardName) subParts.push(boardName);
        if (listName)  subParts.push(listName);
        results.push({
          type: 'card',
          id: card.id,
          name: card.title,
          subTitle: subParts.join(' › '),
          boardId: board?.id
        });
      }
    }

    this.searchResults.set(results.slice(0, 10));
    // Only show dropdown when there are actual results OR when still typing
    this.showSearchResults.set(results.length > 0);
  }

  onSearchResultClick(result: SearchResult) {
    this.showSearchResults.set(false);
    this.searchQuery.set('');
    this.searchResults.set([]);
    if (result.type === 'workspace') {
      this.router.navigate(['/workspaces'], { queryParams: { workspaceId: result.id } });
    } else if (result.type === 'board') {
      this.router.navigate(['/boards'], { queryParams: { boardId: result.id } });
    } else if (result.type === 'card') {
      if (result.boardId) {
        // Navigate directly to the board that contains this card
        this.router.navigate(['/boards'], { queryParams: { boardId: result.boardId } });
      } else {
        // Fallback: go to global cards view
        this.router.navigate(['/cards']);
      }
    }
  }

  clearSearch() {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.showSearchResults.set(false);
  }

  toggleProfileMenu(event: Event) {
    event.stopPropagation();
    this.showProfileMenu.update(v => !v);
    this.showAppSwitcher.set(false);
    this.showCreateMenu.set(false);
  }

  toggleAppSwitcher(event: Event) {
    event.stopPropagation();
    this.showAppSwitcher.update(v => !v);
    this.showProfileMenu.set(false);
    this.showCreateMenu.set(false);
  }

  toggleCreateMenu(event: Event) {
    event.stopPropagation();
    this.showCreateMenu.update(v => !v);
    this.showProfileMenu.set(false);
    this.showAppSwitcher.set(false);
  }

  closeMenus() {
    this.showProfileMenu.set(false);
    this.showAppSwitcher.set(false);
    this.showCreateMenu.set(false);
    this.showSearchResults.set(false);
  }
}
