<script lang="ts">
  import { Card, Avatar, Button } from '$lib/components/ui';
  import type { CombinedMonthlyTotals } from '$lib/types';
  import { formatCurrency, formatMonthYear } from '$lib/utils/format';

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

<Card padding="lg">
  <div class="flex flex-col items-center text-center">
    {#if balance.amount < 0.01}
      <!-- Settled up state -->
      <div class="w-16 h-16 rounded-full bg-positive/10 flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-positive" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-themed mb-1">All settled up!</h2>
      <p class="text-themed-secondary">You and your partner are even</p>
    {:else}
      <!-- Balance owed state -->
      <div class="flex items-center gap-4 mb-4">
        <Avatar name={balance.debtor!} size="xl" color={balance.debtor === 'Lorenzo' ? 'lorenzo' : 'maria'} />
        <div class="flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-themed-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </div>
        <Avatar name={balance.debtor === 'Lorenzo' ? 'Maria' : 'Lorenzo'} size="xl" color={balance.debtor === 'Lorenzo' ? 'maria' : 'lorenzo'} />
      </div>

      <h2 class="text-2xl font-bold text-themed mb-1">
        {balance.debtor} owes {balance.debtor === 'Lorenzo' ? 'Maria' : 'Lorenzo'}
      </h2>
      <p class="text-3xl font-bold text-negative mb-2">
        {formatCurrency(balance.amount)}
      </p>
      <p class="text-sm text-themed-secondary">
        Total balance across all months
      </p>
    {/if}
  </div>

  <!-- Quick stats -->
  {#if monthlyTotals.length > 0}
    <div class="mt-6 pt-6 border-t border-themed grid grid-cols-2 gap-4">
      <div class="text-center">
        <p class="text-sm text-themed-secondary mb-1">Lorenzo's Share</p>
        <p class="text-lg font-semibold text-lorenzo">
          {monthlyTotals.length > 0 ? Math.round(monthlyTotals[0].lorenzo.sharePercent) : 50}%
        </p>
      </div>
      <div class="text-center">
        <p class="text-sm text-themed-secondary mb-1">Maria's Share</p>
        <p class="text-lg font-semibold text-maria">
          {monthlyTotals.length > 0 ? Math.round(monthlyTotals[0].maria.sharePercent) : 50}%
        </p>
      </div>
    </div>
  {/if}
</Card>
