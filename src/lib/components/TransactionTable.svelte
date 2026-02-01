<script lang="ts">
	import { useExpenses } from '$lib/stores/expenses.svelte';
	import { formatBRL, formatRelativeDate, groupTransactionsByDate } from '$lib/utils/format';
	import { Card, Avatar, Badge, Button, Input, Modal, Select, DatePicker } from '$lib/components/ui';
	import type { ExpenseType, ExpenseCategory, Transaction, Owner } from '$lib/types';
	import { EXPENSE_TYPES, EXPENSE_CATEGORIES, OWNERS, EXPENSE_TYPE_EMOJIS, EXPENSE_CATEGORY_EMOJIS } from '$lib/types';

	interface Props {
		onDelete?: () => void;
		onUpdate?: () => void;
	}

	let { onDelete, onUpdate }: Props = $props();

	const expenses = useExpenses();

	let searchInput = $state('');
	let showFutureTransactions = $state(false);

	// Filter states
	let filterType = $state<ExpenseType | 'all'>('all');
	let filterCategory = $state<ExpenseCategory | 'all'>('all');
	let filterOwner = $state<Owner | 'all'>('all');
	let deleteModal = $state<{ open: boolean; transaction: Transaction | null; isDeleting: boolean; error: string }>({
		open: false,
		transaction: null,
		isDeleting: false,
		error: ''
	});

	let editModal = $state<{
		open: boolean;
		originalTransaction: Transaction | null;
		isUpdating: boolean;
		error: string;
		// Form fields
		owner: Owner;
		description: string;
		amount: string;
		type: ExpenseType;
		category: ExpenseCategory | '';
		date: Date;
	}>({
		open: false,
		originalTransaction: null,
		isUpdating: false,
		error: '',
		owner: 'Lorenzo',
		description: '',
		amount: '',
		type: 'Household',
		category: '',
		date: new Date()
	});

	// Options for edit modal
	const typeOptions = EXPENSE_TYPES.map((t) => ({ value: t, label: `${EXPENSE_TYPE_EMOJIS[t]} ${t}` }));
	const categoryOptions = [
		{ value: '', label: 'No category' },
		...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: `${EXPENSE_CATEGORY_EMOJIS[c]} ${c}` }))
	];

	// Options for filters
	const filterTypeOptions = [
		{ value: 'all', label: 'All Types' },
		...EXPENSE_TYPES.map((t) => ({ value: t, label: `${EXPENSE_TYPE_EMOJIS[t]} ${t}` }))
	];
	const filterCategoryOptions = [
		{ value: 'all', label: 'All Categories' },
		...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: `${EXPENSE_CATEGORY_EMOJIS[c]} ${c}` }))
	];
	const filterOwnerOptions = [
		{ value: 'all', label: 'All Owners' },
		...OWNERS.map((o) => ({ value: o, label: o }))
	];

	// Get today's date at midnight for comparison
	const today = new Date();
	today.setHours(23, 59, 59, 999);

	// Apply all filters to transactions
	const visibleTransactions = $derived(() => {
		let filtered = expenses.filteredTransactions;

		// Filter by future transactions
		if (!showFutureTransactions) {
			filtered = filtered.filter(tx => tx.date <= today);
		}

		// Filter by type
		if (filterType !== 'all') {
			filtered = filtered.filter(tx => tx.type === filterType);
		}

		// Filter by category
		if (filterCategory !== 'all') {
			filtered = filtered.filter(tx => tx.category === filterCategory);
		}

		// Filter by owner
		if (filterOwner !== 'all') {
			filtered = filtered.filter(tx => tx.owner === filterOwner);
		}

		return filtered;
	});

	const futureTransactionsCount = $derived(() => {
		return expenses.filteredTransactions.filter(tx => tx.date > today).length;
	});

	function handleSearch() {
		expenses.setSearchQuery(searchInput);
	}

	function clearSearch() {
		searchInput = '';
		expenses.setSearchQuery('');
	}

	function clearFilters() {
		filterType = 'all';
		filterCategory = 'all';
		filterOwner = 'all';
	}

	const hasActiveFilters = $derived(
		filterType !== 'all' || filterCategory !== 'all' || filterOwner !== 'all'
	);

	function openDeleteModal(tx: Transaction) {
		deleteModal = { open: true, transaction: tx, isDeleting: false, error: '' };
	}

	function closeDeleteModal() {
		deleteModal = { open: false, transaction: null, isDeleting: false, error: '' };
	}

	async function confirmDelete() {
		if (!deleteModal.transaction) return;

		deleteModal.isDeleting = true;
		deleteModal.error = '';

		try {
			const tx = deleteModal.transaction;
			const response = await fetch('/api/transactions', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					rowNumber: tx.rowNumber,
					description: tx.description
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to delete transaction');
			}

			closeDeleteModal();
			onDelete?.();
		} catch (err) {
			deleteModal.error = err instanceof Error ? err.message : 'Failed to delete transaction';
			deleteModal.isDeleting = false;
		}
	}

	function openEditModal(tx: Transaction) {
		editModal = {
			open: true,
			originalTransaction: tx,
			isUpdating: false,
			error: '',
			owner: tx.owner,
			description: tx.description,
			amount: tx.amount.toString().replace('.', ','),
			type: tx.type,
			category: tx.category || '',
			date: new Date(tx.date)
		};
	}

	function closeEditModal() {
		editModal = {
			open: false,
			originalTransaction: null,
			isUpdating: false,
			error: '',
			owner: 'Lorenzo',
			description: '',
			amount: '',
			type: 'Household',
			category: '',
			date: new Date()
		};
	}

	async function confirmEdit() {
		if (!editModal.originalTransaction) return;

		// Validation
		if (!editModal.description.trim()) {
			editModal.error = 'Description is required';
			return;
		}

		const parsedAmount = parseFloat(editModal.amount.replace(',', '.'));
		if (isNaN(parsedAmount) || parsedAmount <= 0) {
			editModal.error = 'Please enter a valid amount';
			return;
		}

		if (!editModal.date || isNaN(editModal.date.getTime())) {
			editModal.error = 'Please enter a valid date';
			return;
		}

		editModal.isUpdating = true;
		editModal.error = '';

		try {
			const original = editModal.originalTransaction;
			const response = await fetch('/api/transactions', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					original: {
						rowNumber: original.rowNumber,
						description: original.description
					},
					updated: {
						owner: editModal.owner,
						description: editModal.description.trim(),
						amount: parsedAmount,
						type: editModal.type,
						category: editModal.category || undefined,
						date: editModal.date.toISOString()
					}
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to update transaction');
			}

			closeEditModal();
			onUpdate?.();
		} catch (err) {
			editModal.error = err instanceof Error ? err.message : 'Failed to update transaction';
			editModal.isUpdating = false;
		}
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
		const groups = groupTransactionsByDate(visibleTransactions());
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

		<!-- Filters -->
		<div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
			<Select
				label="Type"
				bind:value={filterType}
				options={filterTypeOptions}
			/>
			<Select
				label="Category"
				bind:value={filterCategory}
				options={filterCategoryOptions}
			/>
			<Select
				label="Owner"
				bind:value={filterOwner}
				options={filterOwnerOptions}
			/>
		</div>

		<!-- Stats and Controls -->
		<div class="flex items-center justify-between mt-3">
			<div class="flex items-center gap-3">
				<p class="text-sm text-themed-secondary">
					{visibleTransactions().length} transaction{visibleTransactions().length !== 1 ? 's' : ''}
					{expenses.searchQuery ? `matching "${expenses.searchQuery}"` : ''}
				</p>
				{#if hasActiveFilters}
					<Button variant="ghost" size="sm" onclick={clearFilters}>
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<line x1="18" y1="6" x2="6" y2="18"/>
							<line x1="6" y1="6" x2="18" y2="18"/>
						</svg>
						Clear Filters
					</Button>
				{/if}
			</div>
			{#if futureTransactionsCount() > 0 || showFutureTransactions}
				<label class="flex items-center gap-2 cursor-pointer">
					<span class="text-sm text-themed-secondary">
						Show future ({futureTransactionsCount()})
					</span>
					<button
						type="button"
						role="switch"
						aria-checked={showFutureTransactions}
						aria-label="Toggle future transactions"
						onclick={() => showFutureTransactions = !showFutureTransactions}
						class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors {showFutureTransactions ? 'bg-primary' : 'bg-themed-tertiary'}"
					>
						<span
							class="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform {showFutureTransactions ? 'translate-x-4' : 'translate-x-0.5'}"
						></span>
					</button>
				</label>
			{/if}
		</div>
	</div>

	<!-- Transaction List -->
	{#if visibleTransactions().length === 0}
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
			{:else if futureTransactionsCount() > 0 && !showFutureTransactions}
				<h3 class="text-lg font-medium text-themed mb-1">No past transactions</h3>
				<p class="text-themed-secondary">Toggle "Show future" to see upcoming transactions</p>
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
								<div class="flex items-center gap-2 mb-0.5 flex-wrap">
									<span class="font-medium text-themed truncate">
										{tx.description}
									</span>
									<Badge variant={getTypeBadgeVariant(tx.type)} size="sm">
										{EXPENSE_TYPE_EMOJIS[tx.type]} {tx.type}
									</Badge>
									{#if tx.category}
										<Badge variant="default" size="sm">
											{EXPENSE_CATEGORY_EMOJIS[tx.category]} {tx.category}
										</Badge>
									{/if}
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

							<!-- Action Buttons -->
							<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
								<button
									onclick={() => openEditModal(tx)}
									class="p-2 rounded-lg text-themed-tertiary hover:text-primary hover:bg-primary/10"
									aria-label="Edit transaction"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
										<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
									</svg>
								</button>
								<button
									onclick={() => openDeleteModal(tx)}
									class="p-2 rounded-lg text-themed-tertiary hover:text-negative hover:bg-negative/10"
									aria-label="Delete transaction"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<polyline points="3 6 5 6 21 6"/>
										<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
									</svg>
								</button>
							</div>
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
	confirmText={deleteModal.isDeleting ? "Deleting..." : "Delete"}
	confirmVariant="danger"
	confirmDisabled={deleteModal.isDeleting}
>
	{#if deleteModal.transaction}
		<p class="text-themed-secondary">
			Are you sure you want to delete "{deleteModal.transaction.description}" ({formatBRL(deleteModal.transaction.amount)})?
		</p>
		{#if deleteModal.error}
			<p class="mt-2 text-sm text-negative">{deleteModal.error}</p>
		{/if}
	{/if}
</Modal>

<!-- Edit Transaction Modal -->
<Modal
	bind:open={editModal.open}
	title="Edit Transaction"
	onclose={closeEditModal}
	onconfirm={confirmEdit}
	confirmText={editModal.isUpdating ? "Saving..." : "Save"}
	confirmVariant="primary"
	confirmDisabled={editModal.isUpdating}
>
	<div class="space-y-4">
		{#if editModal.error}
			<div class="p-3 rounded-lg bg-negative/10 border border-negative/20">
				<p class="text-sm text-negative">{editModal.error}</p>
			</div>
		{/if}

		<!-- Owner Selection -->
		<fieldset>
			<legend class="block text-sm font-medium text-themed-secondary mb-2">Who paid?</legend>
			<div class="flex gap-2">
				{#each OWNERS as o}
					<button
						type="button"
						onclick={() => editModal.owner = o}
						disabled={editModal.isUpdating}
						class="flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all disabled:opacity-50 {editModal.owner === o
							? 'border-primary bg-primary/5 text-primary'
							: 'border-themed text-themed hover:border-themed-tertiary'}"
					>
						{o}
					</button>
				{/each}
			</div>
		</fieldset>

		<div class="grid grid-cols-2 gap-4">
			<Select
				label="Type"
				bind:value={editModal.type}
				options={typeOptions}
				disabled={editModal.isUpdating}
			/>

			<Select
				label="Category"
				bind:value={editModal.category}
				options={categoryOptions}
				disabled={editModal.isUpdating}
			/>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<Input
				type="text"
				label="Amount (R$)"
				bind:value={editModal.amount}
				placeholder="0,00"
				disabled={editModal.isUpdating}
			/>

			<Input
				type="text"
				label="Description"
				bind:value={editModal.description}
				placeholder="What was this expense for?"
				disabled={editModal.isUpdating}
			/>
		</div>

		<DatePicker
			label="Date"
			bind:value={editModal.date}
			disabled={editModal.isUpdating}
		/>
	</div>
</Modal>
