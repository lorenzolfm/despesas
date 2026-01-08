<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    children: Snippet;
  }

  let {
    padding = 'md',
    hover = false,
    children
  }: Props = $props();

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  };
</script>

<div
  class="bg-themed rounded-xl shadow-themed border border-themed transition-all duration-300 ease-out {paddingClasses[padding]} {hover ? 'hover:shadow-themed-lg hover:-translate-y-1 cursor-pointer' : ''}"
>
  {@render children()}
</div>
