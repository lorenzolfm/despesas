<script lang="ts">
  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    value?: string;
    options: Option[];
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    id?: string;
    name?: string;
    onchange?: (e: Event) => void;
  }

  let {
    value = $bindable(''),
    options,
    placeholder = 'Select an option',
    label = '',
    error = '',
    disabled = false,
    required = false,
    id,
    name,
    onchange
  }: Props = $props();

  const selectId = $derived(id || `select-${Math.random().toString(36).slice(2, 9)}`);
</script>

<div class="w-full">
  {#if label}
    <label for={selectId} class="block text-sm font-medium text-themed-secondary mb-1.5">
      {label}
      {#if required}<span class="text-negative">*</span>{/if}
    </label>
  {/if}

  <div class="relative">
    <select
      id={selectId}
      {name}
      bind:value
      {disabled}
      {required}
      {onchange}
      class="w-full min-h-[44px] px-3 py-2 pr-10 bg-themed border border-themed rounded-lg text-themed text-[16px] sm:text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer dark:bg-[var(--bg-primary)] dark:text-[var(--text-primary)] {error ? 'border-negative focus-visible:ring-negative/30' : ''}"
    >
      {#if placeholder}
        <option value="" disabled>{placeholder}</option>
      {/if}
      {#each options as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
    <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
      <svg class="w-4 h-4 text-themed-tertiary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
      </svg>
    </div>
  </div>

  {#if error}
    <p class="mt-1 text-sm text-negative">{error}</p>
  {/if}
</div>
