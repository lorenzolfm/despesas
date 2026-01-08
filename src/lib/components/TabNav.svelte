<script lang="ts">
  import { Avatar } from '$lib/components/ui';

  type Tab = 'transactions' | 'summary' | 'lorenzo' | 'maria';

  interface TabConfig {
    id: Tab;
    label: string;
    icon?: string;
  }

  interface Props {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
  }

  let { activeTab, onTabChange }: Props = $props();

  const tabs: TabConfig[] = [
    { id: 'transactions', label: 'Transactions' },
    { id: 'summary', label: 'Summary' },
    { id: 'lorenzo', label: 'Lorenzo' },
    { id: 'maria', label: 'Maria' }
  ];

  // Store references to tab buttons for indicator positioning
  let tabRefs: HTMLButtonElement[] = $state([]);
  let indicatorStyle = $state('');

  // Update indicator position when activeTab changes
  $effect(() => {
    const activeIndex = tabs.findIndex(t => t.id === activeTab);
    const activeButton = tabRefs[activeIndex];
    if (activeButton) {
      indicatorStyle = `left: ${activeButton.offsetLeft}px; width: ${activeButton.offsetWidth}px;`;
    }
  });
</script>

<nav class="bg-themed border-b border-themed transition-theme">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="relative flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
      {#each tabs as tab, i}
        <button
          bind:this={tabRefs[i]}
          onclick={() => onTabChange(tab.id)}
          class="relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-200 {activeTab === tab.id
            ? 'text-primary'
            : 'text-themed-secondary hover:text-themed'}"
        >
          {#if tab.id === 'lorenzo'}
            <Avatar name="Lorenzo" size="sm" color="lorenzo" />
          {:else if tab.id === 'maria'}
            <Avatar name="Maria" size="sm" color="maria" />
          {:else if tab.id === 'transactions'}
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          {:else if tab.id === 'summary'}
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          {/if}
          <span>{tab.label}</span>
        </button>
      {/each}

      <!-- Sliding indicator -->
      <span
        class="absolute bottom-0 h-0.5 bg-primary rounded-full transition-all duration-300 ease-out"
        style={indicatorStyle}
      ></span>
    </div>
  </div>
</nav>

<style>
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
