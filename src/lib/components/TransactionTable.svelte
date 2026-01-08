<script lang="ts">
	import { useExpenses } from '$lib/stores/expenses.svelte';
	import { formatBRL, formatDate } from '$lib/utils/format';
	import type { ExpenseType } from '$lib/types';

	const expenses = useExpenses();

	let searchInput = $state('');

	function handleSearch() {
		expenses.setSearchQuery(searchInput);
	}

	function handleDelete(id: string) {
		if (confirm('Are you sure you want to delete this transaction?')) {
			expenses.removeTransaction(id);
		}
	}

	function getTypeColor(type: ExpenseType): string {
		switch (type) {
			case 'Income':
				return 'bg-green-100 text-green-800';
			case 'Credit':
				return 'bg-blue-100 text-blue-800';
			case 'Settlement':
				return 'bg-purple-100 text-purple-800';
			case 'Personal':
				return 'bg-gray-100 text-gray-800';
			case 'Household':
				return 'bg-amber-100 text-amber-800';
			case 'Split 50/50':
				return 'bg-orange-100 text-orange-800';
			case 'Paid for Partner':
				return 'bg-pink-100 text-pink-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}
</script>

<div class="bg-white rounded-lg shadow">
	<div class="p-4 border-b">
		<div class="flex gap-2">
			<input
				type="text"
				bind:value={searchInput}
				oninput={handleSearch}
				placeholder="Search by description..."
				class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
			/>
			{#if searchInput}
				<button
					onclick={() => {
						searchInput = '';
						expenses.setSearchQuery('');
					}}
					class="px-3 py-2 text-gray-600 hover:text-gray-800"
				>
					Clear
				</button>
			{/if}
		</div>
		<p class="text-sm text-gray-500 mt-2">
			{expenses.filteredTransactions.length} transaction{expenses.filteredTransactions.length !== 1
				? 's'
				: ''}
			{expenses.searchQuery ? `matching "${expenses.searchQuery}"` : ''}
		</p>
	</div>

	{#if expenses.filteredTransactions.length === 0}
		<div class="p-8 text-center text-gray-500">
			{#if expenses.transactions.length === 0}
				<p>No transactions yet. Add one above or import from CSV.</p>
			{:else}
				<p>No transactions match your search.</p>
			{/if}
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>Date</th
						>
						<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>Owner</th
						>
						<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>Description</th
						>
						<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>Type</th
						>
						<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
							>Amount</th
						>
						<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
							>Actions</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#each expenses.filteredTransactions as tx (tx.id)}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
								{formatDate(tx.date)}
							</td>
							<td class="px-4 py-3 text-sm whitespace-nowrap">
								<span
									class="inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-medium text-xs {tx.owner ===
									'Lorenzo'
										? 'bg-blue-500'
										: 'bg-pink-500'}"
								>
									{tx.owner[0]}
								</span>
							</td>
							<td class="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
								{tx.description}
							</td>
							<td class="px-4 py-3 text-sm whitespace-nowrap">
								<span class="px-2 py-1 rounded-full text-xs font-medium {getTypeColor(tx.type)}">
									{tx.type}
								</span>
							</td>
							<td class="px-4 py-3 text-sm text-gray-900 text-right whitespace-nowrap font-mono">
								{formatBRL(tx.amount)}
							</td>
							<td class="px-4 py-3 text-center">
								<button
									onclick={() => handleDelete(tx.id)}
									class="text-red-600 hover:text-red-800 text-sm"
								>
									Delete
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
