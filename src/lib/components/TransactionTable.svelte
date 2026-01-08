<script lang="ts">
	import { useExpenses } from '$lib/stores/expenses.svelte';
	import { formatBRL, formatRelativeDate, groupTransactionsByDate } from '$lib/utils/format';
	import { Card, Avatar, Badge, Button, Input, Modal } from '$lib/components/ui';
	import type { ExpenseType, Transaction } from '$lib/types';

	const expenses = useExpenses();

	let searchInput = $state('');
	let deleteModal = $state<{ open: boolean; transaction: Transaction | null }>({
		open: false,
		transaction: null
	});

	function handleSearch() {
		expenses.setSearchQuery(searchInput);
	}

	function clearSearch() {
		searchInput = '';
		expenses.setSearchQuery('');
	}

	function openDeleteModal(tx: Transaction) {
		deleteModal = { open: true, transaction: tx };
	}

	function closeDeleteModal() {
		deleteModal = { open: false, transaction: null };
	}

	function confirmDelete() {
		if (deleteModal.transaction) {
			expenses.removeTransaction(deleteModal.transaction.id);
		}
		closeDeleteModal();
	}

	function getTypeBadgeVariant(type: ExpenseType): 'income' | 'rent' | 'utilities' | 'groceries' | 'transport' | 'health' | 'leisure' | 'other' | 'success' | 'warning' | 'danger' | 'default' {
		switch (type) {
			case 'Income':
				return 'income';
			case 'Credit':
				return 'transport';
			case 'Settlement':
				return 'rent';
			case 'Personal':
				return 'other';
			case 'Household':
				return 'utilities';
			case 'Split 50/50':
				return 'warning';
			case 'Paid for Partner':
				return 'leisure';
			default:
				return 'default';
		}
	}

	// Group transactions by date
	const groupedTransactions = $derived(() => {
		const groups = groupTransactionsByDate(expenses.filteredTransactions);
		return Array.from(groups.entries()).map(([dateStr, txs]) => ({
			date: new Date(dateStr),
			transactions: txs
		}));
	});
</script>

<Card padding="none">
	<!-- Search Header -->
	<div class="p-4 border-b border-themed">
		<div class="flex gap-3 items-center">
			<div class="flex-1 relative">
				<svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-themed-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="11" cy="11" r="8"/>
					<line x1="21" y1="21" x2="16.65" y2="16.65"/>
				</svg>
				<input
					type="text"
					bind:value={searchInput}
					oninput={handleSearch}
					placeholder="Search transactions..."
					class="w-full pl-10 pr-4 py-2 bg-themed-secondary border-none rounded-lg text-themed placeholder:text-themed-tertiary transition-theme focus:outline-none focus:ring-2 focus:ring-primary"
				/>
			</div>
			{#if searchInput}
				<Button variant="ghost" size="sm" onclick={clearSearch}>
					<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18"/>
						<line x1="6" y1="6" x2="18" y2="18"/>
					</svg>
					Clear
				</Button>
			{/if}
		</div>
		<p class="text-sm text-themed-secondary mt-2">
			{expenses.filteredTransactions.length} transaction{expenses.filteredTransactions.length !== 1 ? 's' : ''}
			{expenses.searchQuery ? `matching "${expenses.searchQuery}"` : ''}
		</p>
	</div>

	<!-- Transaction List -->
	{#if expenses.filteredTransactions.length === 0}
		<div class="p-12 text-center">
			<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-themed-tertiary flex items-center justify-center">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-themed-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
					<line x1="16" y1="2" x2="16" y2="6"/>
					<line x1="8" y1="2" x2="8" y2="6"/>
					<line x1="3" y1="10" x2="21" y2="10"/>
				</svg>
			</div>
			{#if expenses.transactions.length === 0}
				<h3 class="text-lg font-medium text-themed mb-1">No transactions yet</h3>
				<p class="text-themed-secondary">Add your first transaction above or import from CSV</p>
			{:else}
				<h3 class="text-lg font-medium text-themed mb-1">No results found</h3>
				<p class="text-themed-secondary">Try adjusting your search</p>
			{/if}
		</div>
	{:else}
		<div class="divide-y divide-themed-light">
			{#each groupedTransactions() as group}
				<!-- Date Group Header -->
				<div class="px-4 py-2 bg-themed-secondary">
					<span class="text-sm font-medium text-themed-secondary">
						{formatRelativeDate(group.date)}
					</span>
				</div>

				<!-- Transactions for this date -->
				{#each group.transactions as tx (tx.id)}
					<div class="px-4 py-3 hover:bg-themed-secondary/50 transition-colors group">
						<div class="flex items-center gap-4">
							<!-- Owner Avatar -->
							<Avatar
								name={tx.owner}
								size="md"
								color={tx.owner === 'Lorenzo' ? 'lorenzo' : 'maria'}
							/>

							<!-- Transaction Details -->
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-0.5">
									<span class="font-medium text-themed truncate">
										{tx.description}
									</span>
									<Badge variant={getTypeBadgeVariant(tx.type)} size="sm">
										{tx.type}
									</Badge>
								</div>
								<p class="text-sm text-themed-secondary">
									{tx.owner}
								</p>
							</div>

							<!-- Amount -->
							<div class="text-right">
								<span class="font-semibold font-mono {tx.type === 'Income' ? 'text-positive' : 'text-themed'}">
									{tx.type === 'Income' ? '+' : ''}{formatBRL(tx.amount)}
								</span>
							</div>

							<!-- Delete Button -->
							<button
								onclick={() => openDeleteModal(tx)}
								class="p-2 rounded-lg text-themed-tertiary hover:text-negative hover:bg-negative/10 opacity-0 group-hover:opacity-100 transition-all"
								aria-label="Delete transaction"
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<polyline points="3 6 5 6 21 6"/>
									<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
								</svg>
							</button>
						</div>
					</div>
				{/each}
			{/each}
		</div>
	{/if}
</Card>

<!-- Delete Confirmation Modal -->
<Modal
	bind:open={deleteModal.open}
	title="Delete Transaction"
	onclose={closeDeleteModal}
	onconfirm={confirmDelete}
	confirmText="Delete"
	confirmVariant="danger"
>
	{#if deleteModal.transaction}
		<p class="text-themed-secondary">
			Are you sure you want to delete "{deleteModal.transaction.description}" ({formatBRL(deleteModal.transaction.amount)})?
		</p>
	{/if}
</Modal>
