<script lang="ts">
	import type { Owner } from '$lib/types';
	import { useExpenses } from '$lib/stores/expenses.svelte';
	import { formatBRL, formatMonthYear, formatPercent, getMonthRange, formatDate } from '$lib/utils/format';

	interface Props {
		owner: Owner;
	}

	let { owner }: Props = $props();

	const expenses = useExpenses();

	const partnerName = $derived(owner === 'Lorenzo' ? 'Maria' : 'Lorenzo');

	const personTotals = $derived(
		expenses.monthlyTotals.map((month) => (owner === 'Lorenzo' ? month.lorenzo : month.maria))
	);
</script>

<div class="bg-white rounded-lg shadow">
	<div class="p-4 border-b">
		<h2 class="text-lg font-semibold">{owner}'s Monthly Summary</h2>
		<p class="text-sm text-gray-500">Personal breakdown and debt calculation</p>
	</div>

	{#if personTotals.length === 0}
		<div class="p-8 text-center text-gray-500">
			<p>No transactions yet. Add some transactions to see the summary.</p>
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
						<th class="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Income</th>
						<th class="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Share</th>
						<th class="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
						<th class="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase" title="What they paid">
							50/50 Paid
						</th>
						<th class="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase" title="What they should pay">
							50/50 Portion
						</th>
						<th class="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
							Paid for {partnerName}
						</th>
						<th class="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase" title="What they paid">
							Household Paid
						</th>
						<th class="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase" title="What they should pay">
							Household Portion
						</th>
						<th class="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Personal</th>
						<th class="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Paid</th>
						<th class="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Settlement</th>
						<th class="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debt</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#each personTotals as person, i}
						{@const range = getMonthRange(person.monthKey)}
						<tr class="hover:bg-gray-50">
							<td class="px-3 py-3">
								<div class="font-medium">{formatMonthYear(person.monthKey)}</div>
								<div class="text-xs text-gray-500">
									{formatDate(range.start)} - {formatDate(range.end)}
								</div>
							</td>
							<td class="px-3 py-3 text-right font-mono text-green-600">
								{formatBRL(person.income)}
							</td>
							<td class="px-3 py-3 text-right font-mono">
								{formatPercent(person.sharePercent)}
							</td>
							<td class="px-3 py-3 text-right font-mono text-blue-600">
								{formatBRL(person.credit)}
							</td>
							<td class="px-3 py-3 text-right font-mono">
								{formatBRL(person.split5050Paid)}
							</td>
							<td class="px-3 py-3 text-right font-mono text-gray-500">
								{formatBRL(person.split5050Portion)}
							</td>
							<td class="px-3 py-3 text-right font-mono">
								{formatBRL(person.paidForPartner)}
							</td>
							<td class="px-3 py-3 text-right font-mono">
								{formatBRL(person.householdPaid)}
							</td>
							<td class="px-3 py-3 text-right font-mono text-gray-500">
								{formatBRL(person.householdPortion)}
							</td>
							<td class="px-3 py-3 text-right font-mono">
								{formatBRL(person.personal)}
							</td>
							<td class="px-3 py-3 text-right font-mono font-semibold">
								{formatBRL(person.total)}
							</td>
							<td class="px-3 py-3 text-right font-mono text-purple-600">
								{formatBRL(person.settlement)}
							</td>
							<td
								class="px-3 py-3 text-right font-mono font-semibold {person.debt > 0
									? 'text-red-600'
									: person.debt < 0
										? 'text-green-600'
										: 'text-gray-600'}"
							>
								{formatBRL(person.debt)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Debt Explanation -->
		{#if personTotals.length > 0}
			{@const latest = personTotals[0]}
			<div class="p-4 border-t bg-gray-50">
				<h3 class="text-sm font-medium text-gray-700 mb-3">
					{formatMonthYear(latest.monthKey)} - Debt Breakdown
				</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
					<div class="space-y-2">
						<div class="font-medium text-gray-700">What {owner} should pay:</div>
						<div class="pl-4 space-y-1 text-gray-600">
							<div>50/50 portion: {formatBRL(latest.split5050Portion)}</div>
							<div>Household portion ({formatPercent(latest.sharePercent)}): {formatBRL(latest.householdPortion)}</div>
							<div>+ What {partnerName} paid for {owner}: calculated from {partnerName}'s "Paid for Partner"</div>
						</div>
					</div>
					<div class="space-y-2">
						<div class="font-medium text-gray-700">What {owner} actually paid:</div>
						<div class="pl-4 space-y-1 text-gray-600">
							<div>50/50 expenses: {formatBRL(latest.split5050Paid)}</div>
							<div>Household expenses: {formatBRL(latest.householdPaid)}</div>
							<div>Paid for {partnerName}: {formatBRL(latest.paidForPartner)}</div>
							<div>Settlement: {formatBRL(latest.settlement)}</div>
						</div>
					</div>
				</div>
				<div class="mt-4 p-3 rounded-lg {latest.debt > 0 ? 'bg-red-100' : latest.debt < 0 ? 'bg-green-100' : 'bg-gray-100'}">
					<div class="font-semibold {latest.debt > 0 ? 'text-red-800' : latest.debt < 0 ? 'text-green-800' : 'text-gray-800'}">
						{#if latest.debt > 0}
							{owner} owes {partnerName}: {formatBRL(latest.debt)}
						{:else if latest.debt < 0}
							{partnerName} owes {owner}: {formatBRL(Math.abs(latest.debt))}
						{:else}
							All settled for this month
						{/if}
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>
