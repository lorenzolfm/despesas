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
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    rent: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    utilities: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    groceries: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    transport: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    health: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    leisure: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300',
    other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    income: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    investment: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300'
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
