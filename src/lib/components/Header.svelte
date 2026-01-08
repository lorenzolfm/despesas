<script lang="ts">
  import { Avatar, ThemeToggle } from '$lib/components/ui';

  interface Props {
    transactionCount: number;
  }

  let { transactionCount }: Props = $props();
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
            {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <!-- Right side: Avatars and theme toggle -->
      <div class="flex items-center gap-4">
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
