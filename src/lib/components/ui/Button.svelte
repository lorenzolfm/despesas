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

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]';

  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary/40 shadow-sm shadow-primary/20 dark:focus:ring-offset-[#282828]',
    secondary: 'bg-themed-tertiary text-themed border border-themed hover:bg-themed-secondary focus:ring-primary/30 dark:focus:ring-offset-[#282828]',
    ghost: 'text-themed-secondary hover:bg-themed-tertiary hover:text-themed focus:ring-primary/30 dark:focus:ring-offset-[#282828]',
    danger: 'bg-negative text-white hover:bg-negative/80 focus:ring-negative/40 dark:focus:ring-offset-[#282828]',
    success: 'bg-positive text-white hover:bg-positive/80 focus:ring-positive/40 dark:focus:ring-offset-[#282828]'
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
