<script lang="ts">
  import { Avatar, ThemeToggle, Button } from '$lib/components/ui';

  interface Props {
    transactionCount: number;
    isLoading?: boolean;
    onRefresh?: () => void;
  }

  let { transactionCount, isLoading = false, onRefresh }: Props = $props();
</script>

<header class="bg-themed border-b border-themed transition-theme">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <!-- Logo and title -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div>
          <h1 class="text-xl font-bold text-themed">Despesas</h1>
          <p class="text-xs text-themed-secondary">
            {#if isLoading}
              <span class="inline-flex items-center gap-1">
                <svg class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            {:else}
              {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
            {/if}
          </p>
        </div>
      </div>

      <!-- Right side: Refresh, Avatars and theme toggle -->
      <div class="flex items-center gap-4">
        {#if onRefresh}
          <Button variant="ghost" onclick={onRefresh} disabled={isLoading}>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 {isLoading ? 'animate-spin' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 2v6h-6"/>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
              <path d="M3 22v-6h6"/>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
            </svg>
            <span class="hidden sm:inline">Refresh</span>
          </Button>
        {/if}
        <div class="hidden sm:flex items-center gap-2">
          <Avatar name="Lorenzo" size="md" color="lorenzo" />
          <span class="text-themed-secondary">&</span>
          <Avatar name="Maria" size="md" color="maria" />
        </div>
        <ThemeToggle />
      </div>
    </div>
  </div>
</header>
