<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    fullWidth?: boolean;
    onclick?: (e: MouseEvent) => void;
    children: Snippet;
  }

  let {
    variant = 'primary',
    size = 'md',
    disabled = false,
    type = 'button',
    fullWidth = false,
    onclick,
    children
  }: Props = $props();

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] active:transition-transform';

  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary dark:focus:ring-offset-gray-800',
    secondary: 'bg-themed-tertiary text-themed border border-themed hover:bg-themed-secondary focus:ring-primary dark:focus:ring-offset-gray-800',
    ghost: 'text-themed-secondary hover:bg-themed-tertiary hover:text-themed focus:ring-primary dark:focus:ring-offset-gray-800',
    danger: 'bg-negative text-white hover:bg-red-600 focus:ring-negative dark:focus:ring-offset-gray-800',
    success: 'bg-positive text-white hover:bg-green-600 focus:ring-positive dark:focus:ring-offset-gray-800'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2'
  };
</script>

<button
  {type}
  {disabled}
  class="{baseClasses} {variantClasses[variant]} {sizeClasses[size]} {fullWidth ? 'w-full' : ''}"
  onclick={onclick}
>
  {@render children()}
</button>
