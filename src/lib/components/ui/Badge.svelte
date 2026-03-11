<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'default' | 'rent' | 'utilities' | 'groceries' | 'transport' | 'health' | 'leisure' | 'other' | 'income' | 'success' | 'warning' | 'danger' | 'investment';
    size?: 'sm' | 'md';
    children: Snippet;
  }

  let {
    variant = 'default',
    size = 'md',
    children
  }: Props = $props();

  const variantClasses = {
    default: 'bg-other/15 text-other dark:bg-other/25',
    rent: 'bg-rent/15 text-rent dark:bg-rent/25',
    utilities: 'bg-utilities/15 text-utilities dark:bg-utilities/25',
    groceries: 'bg-groceries/15 text-groceries dark:bg-groceries/25',
    transport: 'bg-transport/15 text-transport dark:bg-transport/25',
    health: 'bg-health/15 text-health dark:bg-health/25',
    leisure: 'bg-leisure/15 text-leisure dark:bg-leisure/25',
    other: 'bg-other/15 text-other dark:bg-other/25',
    income: 'bg-positive/15 text-positive dark:bg-positive/25',
    success: 'bg-positive/15 text-positive dark:bg-positive/25',
    warning: 'bg-warning/15 text-warning dark:bg-warning/25',
    danger: 'bg-negative/15 text-negative dark:bg-negative/25',
    investment: 'bg-info/15 text-info dark:bg-info/25'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs'
  };
</script>

<span
  class="inline-flex items-center font-medium rounded-full {variantClasses[variant]} {sizeClasses[size]}"
>
  {@render children()}
</span>
