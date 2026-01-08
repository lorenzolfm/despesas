<script lang="ts">
  interface Props {
    type?: 'text' | 'number' | 'email' | 'password' | 'date' | 'search';
    value?: string | number;
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    step?: string;
    min?: string | number;
    max?: string | number;
    id?: string;
    name?: string;
    oninput?: (e: Event) => void;
    onchange?: (e: Event) => void;
  }

  let {
    type = 'text',
    value = $bindable(''),
    placeholder = '',
    label = '',
    error = '',
    disabled = false,
    required = false,
    step,
    min,
    max,
    id,
    name,
    oninput,
    onchange
  }: Props = $props();

  const inputId = $derived(id || `input-${Math.random().toString(36).slice(2, 9)}`);
</script>

<div class="w-full">
  {#if label}
    <label for={inputId} class="block text-sm font-medium text-themed-secondary mb-1.5">
      {label}
      {#if required}<span class="text-negative">*</span>{/if}
    </label>
  {/if}

  <input
    {type}
    id={inputId}
    {name}
    bind:value
    {placeholder}
    {disabled}
    {required}
    {step}
    {min}
    {max}
    {oninput}
    {onchange}
    class="w-full px-3 py-2 bg-themed border border-themed rounded-lg text-themed placeholder:text-themed-tertiary transition-theme focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed {error ? 'border-negative focus:ring-negative' : ''}"
  />

  {#if error}
    <p class="mt-1 text-sm text-negative">{error}</p>
  {/if}
</div>
