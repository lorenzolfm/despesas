<script lang="ts">
  interface Props {
    value?: Date;
    label?: string;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    id?: string;
  }

  let {
    value = $bindable(new Date()),
    label = '',
    error = '',
    disabled = false,
    required = false,
    id
  }: Props = $props();

  let showCalendar = $state(false);
  let inputValue = $state('');
  let calendarContainer: HTMLDivElement;

  const inputId = $derived(id || `datepicker-${Math.random().toString(36).slice(2, 9)}`);

  // Format date as dd/mm/yyyy
  function formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Parse dd/mm/yyyy to Date
  function parseDate(str: string): Date | null {
    const parts = str.split('/').map(Number);
    if (parts.length !== 3) return null;
    const [day, month, year] = parts;
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;
    const fullYear = year < 100 ? (year < 50 ? 2000 + year : 1900 + year) : year;
    const date = new Date(fullYear, month - 1, day);
    if (isNaN(date.getTime())) return null;
    return date;
  }

  // Initialize input value
  $effect(() => {
    if (value) {
      inputValue = formatDate(value);
    }
  });

  // Calendar state
  let viewDate = $state(new Date());

  $effect(() => {
    if (value) {
      viewDate = new Date(value);
    }
  });

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const calendarDays = $derived.by(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (number | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(i);
    }

    return days;
  });

  function handleInputChange() {
    const parsed = parseDate(inputValue);
    if (parsed) {
      value = parsed;
      viewDate = new Date(parsed);
    }
  }

  function handleInputBlur() {
    // Reformat on blur to ensure consistent format
    if (value) {
      inputValue = formatDate(value);
    }
  }

  function selectDay(day: number) {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    value = newDate;
    inputValue = formatDate(newDate);
    showCalendar = false;
  }

  function prevMonth() {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  }

  function nextMonth() {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  }

  function isToday(day: number): boolean {
    const today = new Date();
    return day === today.getDate() &&
           viewDate.getMonth() === today.getMonth() &&
           viewDate.getFullYear() === today.getFullYear();
  }

  function isSelected(day: number): boolean {
    if (!value) return false;
    return day === value.getDate() &&
           viewDate.getMonth() === value.getMonth() &&
           viewDate.getFullYear() === value.getFullYear();
  }

  function handleClickOutside(event: MouseEvent) {
    if (calendarContainer && !calendarContainer.contains(event.target as Node)) {
      showCalendar = false;
    }
  }

  $effect(() => {
    if (showCalendar) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  });
</script>

<div class="w-full relative" bind:this={calendarContainer}>
  {#if label}
    <label for={inputId} class="block text-sm font-medium text-themed-secondary mb-1.5">
      {label}
      {#if required}<span class="text-negative">*</span>{/if}
    </label>
  {/if}

  <div class="relative">
    <input
      type="text"
      id={inputId}
      bind:value={inputValue}
      oninput={handleInputChange}
      onblur={handleInputBlur}
      onfocus={() => showCalendar = true}
      placeholder="dd/mm/aaaa"
      {disabled}
      {required}
      class="w-full px-3 py-2 pr-10 bg-themed border border-themed rounded-lg text-themed placeholder:text-themed-tertiary transition-theme focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed {error ? 'border-negative focus:ring-negative' : ''}"
    />
    <button
      type="button"
      onclick={() => showCalendar = !showCalendar}
      {disabled}
      aria-label="Toggle calendar"
      class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-themed-secondary hover:text-themed disabled:opacity-50"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    </button>
  </div>

  {#if showCalendar && !disabled}
    <div class="absolute z-50 mt-1 p-3 bg-themed border border-themed rounded-lg shadow-lg min-w-[280px]">
      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <button
          type="button"
          onclick={prevMonth}
          aria-label="Previous month"
          class="p-1 hover:bg-themed-tertiary rounded transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-themed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span class="font-medium text-themed">
          {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
        </span>
        <button
          type="button"
          onclick={nextMonth}
          aria-label="Next month"
          class="p-1 hover:bg-themed-tertiary rounded transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-themed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      <!-- Day names -->
      <div class="grid grid-cols-7 gap-1 mb-1">
        {#each dayNames as day}
          <div class="text-center text-xs font-medium text-themed-secondary py-1">
            {day}
          </div>
        {/each}
      </div>

      <!-- Days grid -->
      <div class="grid grid-cols-7 gap-1">
        {#each calendarDays as day}
          {#if day === null}
            <div></div>
          {:else}
            <button
              type="button"
              onclick={() => selectDay(day)}
              class="w-8 h-8 text-sm rounded-full transition-colors
                {isSelected(day)
                  ? 'bg-primary text-white'
                  : isToday(day)
                    ? 'bg-primary/20 text-primary hover:bg-primary/30'
                    : 'text-themed hover:bg-themed-tertiary'}"
            >
              {day}
            </button>
          {/if}
        {/each}
      </div>
    </div>
  {/if}

  {#if error}
    <p class="mt-1 text-sm text-negative">{error}</p>
  {/if}
</div>
