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

  // 'days' = normal calendar, 'months' = month/year picker
  let view: 'days' | 'months' = $state('days');

  function toggleCalendar() {
    if (!disabled) {
      showCalendar = !showCalendar;
      if (showCalendar) view = 'days';
    }
  }

  function showMonthPicker() {
    view = 'months';
  }

  function selectMonth(month: number) {
    viewDate = new Date(viewDate.getFullYear(), month, 1);
    view = 'days';
  }

  function prevYear() {
    viewDate = new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1);
  }

  function nextYear() {
    viewDate = new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1);
  }

  const shortMonthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

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

  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="relative cursor-pointer" role="button" tabindex="0" onclick={toggleCalendar}>
    <input
      type="text"
      id={inputId}
      readonly
      value={inputValue}
      placeholder="dd/mm/aaaa"
      {disabled}
      {required}
      class="w-full min-h-[44px] px-3 py-2 pr-10 bg-themed border border-themed rounded-lg text-themed text-[16px] sm:text-sm placeholder:text-themed-tertiary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer pointer-events-none {error ? 'border-negative focus:ring-negative/30' : ''}"
    />
    <div class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-themed-secondary">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    </div>
  </div>

  {#if showCalendar && !disabled}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="absolute z-50 mt-1 p-3 bg-themed border border-themed-light rounded-xl shadow-themed-lg min-w-[280px] animate-slide-down" role="dialog" onclick={(e) => e.stopPropagation()}>
      {#if view === 'days'}
        <!-- Header -->
        <div class="flex items-center justify-between mb-3">
          <button
            type="button"
            onclick={prevMonth}
            aria-label="Previous month"
            class="p-1.5 hover:bg-themed-tertiary rounded-lg transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-themed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <button
            type="button"
            onclick={showMonthPicker}
            class="text-sm font-semibold text-themed hover:bg-themed-tertiary px-2 py-1 rounded-lg transition-colors cursor-pointer"
          >
            {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
          </button>
          <button
            type="button"
            onclick={nextMonth}
            aria-label="Next month"
            class="p-1.5 hover:bg-themed-tertiary rounded-lg transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-themed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        <!-- Day names -->
        <div class="grid grid-cols-7 gap-1 mb-1">
          {#each dayNames as day}
            <div class="text-center text-xs font-medium text-themed-tertiary py-1">
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
                class="w-8 h-8 text-sm rounded-full transition-colors cursor-pointer
                  {isSelected(day)
                    ? 'bg-primary text-white font-semibold'
                    : isToday(day)
                      ? 'bg-primary/15 text-primary font-medium hover:bg-primary/25'
                      : 'text-themed hover:bg-themed-tertiary'}"
              >
                {day}
              </button>
            {/if}
          {/each}
        </div>
      {:else}
        <!-- Month/Year picker -->
        <div class="flex items-center justify-between mb-3">
          <button
            type="button"
            onclick={prevYear}
            aria-label="Previous year"
            class="p-1.5 hover:bg-themed-tertiary rounded-lg transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-themed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span class="text-sm font-semibold text-themed">
            {viewDate.getFullYear()}
          </span>
          <button
            type="button"
            onclick={nextYear}
            aria-label="Next year"
            class="p-1.5 hover:bg-themed-tertiary rounded-lg transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-themed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        <!-- Months grid -->
        <div class="grid grid-cols-3 gap-2">
          {#each shortMonthNames as month, i}
            <button
              type="button"
              onclick={() => selectMonth(i)}
              class="py-2 text-sm rounded-lg transition-colors cursor-pointer
                {viewDate.getMonth() === i
                  ? 'bg-primary text-white font-semibold'
                  : 'text-themed hover:bg-themed-tertiary'}"
            >
              {month}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  {#if error}
    <p class="mt-1 text-sm text-negative">{error}</p>
  {/if}
</div>
