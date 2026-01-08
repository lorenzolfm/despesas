<script lang="ts">
	import { useExpenses } from '$lib/stores/expenses.svelte';
	import { formatBRL, formatMonthYear, getMonthRange, formatDate } from '$lib/utils/format';

	const expenses = useExpenses();
</script>

<div class="bg-white rounded-lg shadow">
	<div class="p-4 border-b">
		<h2 class="text-lg font-semibold">Combined Monthly Summary</h2>
		<p class="text-sm text-gray-500">All expenses for both Lorenzo and Maria</p>
	</div>

	{#if expenses.monthlyTotals.length === 0}
		<div class="p-8 text-center text-gray-500">
			<p>No transactions yet. Add some transactions to see the summary.</p>
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
						<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Income</th>
						<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
						<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Split 50/50</th>
						<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid for Partner</th>
						<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Household</th>
						<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Personal</th>
						<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Expenses</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#each expenses.monthlyTotals as month}
						{@const range = getMonthRange(month.monthKey)}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-3 text-sm">
								<div class="font-medium">{formatMonthYear(month.monthKey)}</div>
								<div class="text-xs text-gray-500">
									{formatDate(range.start)} - {formatDate(range.end)}
								</div>
							</td>
							<td class="px-4 py-3 text-sm text-right font-mono text-green-600">
								{formatBRL(month.totalIncome)}
							</td>
							<td class="px-4 py-3 text-sm text-right font-mono text-blue-600">
								{formatBRL(month.totalCredit)}
							</td>
							<td class="px-4 py-3 text-sm text-right font-mono">
								{formatBRL(month.totalSplit5050)}
							</td>
							<td class="px-4 py-3 text-sm text-right font-mono">
								{formatBRL(month.totalPaidForPartner)}
							</td>
							<td class="px-4 py-3 text-sm text-right font-mono">
								{formatBRL(month.totalHousehold)}
							</td>
							<td class="px-4 py-3 text-sm text-right font-mono">
								{formatBRL(month.totalPersonal)}
							</td>
							<td class="px-4 py-3 text-sm text-right font-mono font-semibold">
								{formatBRL(month.grandTotal)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Balance Summary -->
		{#if expenses.monthlyTotals.length > 0}
			{@const latestMonth = expenses.monthlyTotals[0]}
			<div class="p-4 border-t bg-gray-50">
				<h3 class="text-sm font-medium text-gray-700 mb-2">
					Latest Month Balance ({formatMonthYear(latestMonth.monthKey)})
				</h3>
				<div class="flex gap-4">
					<div class="flex-1 p-3 bg-white rounded-lg">
						<div class="text-sm text-gray-500">Lorenzo's Debt</div>
						<div
							class="text-lg font-semibold {latestMonth.lorenzo.debt > 0
								? 'text-red-600'
								: latestMonth.lorenzo.debt < 0
									? 'text-green-600'
									: 'text-gray-600'}"
						>
							{#if latestMonth.lorenzo.debt > 0}
								Owes Maria {formatBRL(latestMonth.lorenzo.debt)}
							{:else if latestMonth.lorenzo.debt < 0}
								Maria owes {formatBRL(Math.abs(latestMonth.lorenzo.debt))}
							{:else}
								Settled
							{/if}
						</div>
					</div>
					<div class="flex-1 p-3 bg-white rounded-lg">
						<div class="text-sm text-gray-500">Maria's Debt</div>
						<div
							class="text-lg font-semibold {latestMonth.maria.debt > 0
								? 'text-red-600'
								: latestMonth.maria.debt < 0
									? 'text-green-600'
									: 'text-gray-600'}"
						>
							{#if latestMonth.maria.debt > 0}
								Owes Lorenzo {formatBRL(latestMonth.maria.debt)}
							{:else if latestMonth.maria.debt < 0}
								Lorenzo owes {formatBRL(Math.abs(latestMonth.maria.debt))}
							{:else}
								Settled
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>
