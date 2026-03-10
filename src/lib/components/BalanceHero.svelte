<script lang="ts">
  import { Card, Avatar } from '$lib/components/ui';
  import type { CombinedMonthlyTotals } from '$lib/types';
  import { formatCurrency } from '$lib/utils/format';

  interface Props {
    monthlyTotals: CombinedMonthlyTotals[];
  }

  let { monthlyTotals }: Props = $props();

  // Get the most recent month's balance
  const currentBalance = $derived(() => {
    if (monthlyTotals.length === 0) return { amount: 0, debtor: null as 'Lorenzo' | 'Maria' | null };

    // Sum up all debts across all months
    let totalDebt = 0;
    for (const month of monthlyTotals) {
      totalDebt += month.lorenzo.debt;
    }

    if (Math.abs(totalDebt) < 0.01) {
      return { amount: 0, debtor: null };
    }

    // Positive means Lorenzo owes Maria
    return {
      amount: Math.abs(totalDebt),
      debtor: totalDebt > 0 ? 'Lorenzo' as const : 'Maria' as const
    };
  });

  const balance = $derived(currentBalance());
</script>

<Card padding="none">
  <!-- Accent bar at top -->
  <div class="h-1 {balance.amount < 0.01 ? 'bg-primary' : 'bg-negative'}"></div>

  <div class="p-5 sm:p-6">
    <div class="flex flex-col items-center text-center">
      {#if balance.amount < 0.01}
        <!-- Settled up state -->
        <div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 animate-check-scale">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-themed mb-0.5">All settled up!</h2>
        <p class="text-sm text-themed-secondary">You and your partner are even</p>
      {:else}
        <!-- Balance owed state -->
        <div class="flex items-center gap-4 mb-3">
          <Avatar name={balance.debtor!} size="xl" color={balance.debtor === 'Lorenzo' ? 'lorenzo' : 'maria'} />
          <div class="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-themed-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </div>
          <Avatar name={balance.debtor === 'Lorenzo' ? 'Maria' : 'Lorenzo'} size="xl" color={balance.debtor === 'Lorenzo' ? 'maria' : 'lorenzo'} />
        </div>

        <h2 class="text-lg font-semibold text-themed mb-1">
          {balance.debtor} owes {balance.debtor === 'Lorenzo' ? 'Maria' : 'Lorenzo'}
        </h2>
        <p class="text-4xl font-extrabold text-negative mb-1 font-mono">
          {formatCurrency(balance.amount)}
        </p>
        <p class="text-xs text-themed-tertiary">
          Total balance across all months
        </p>
      {/if}
    </div>
  </div>
</Card>
