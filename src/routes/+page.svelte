<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '$lib/components/Header.svelte';
	import TabNav from '$lib/components/TabNav.svelte';
	import BalanceHero from '$lib/components/BalanceHero.svelte';
	import ExpenseForm from '$lib/components/ExpenseForm.svelte';
	import TransactionTable from '$lib/components/TransactionTable.svelte';
	import CsvImport from '$lib/components/CsvImport.svelte';
	import CombinedSummary from '$lib/components/CombinedSummary.svelte';
	import IndividualSummary from '$lib/components/IndividualSummary.svelte';
	import { Modal, Button } from '$lib/components/ui';
	import { useExpenses } from '$lib/stores/expenses.svelte';
	import type { Transaction } from '$lib/types';

	const expenses = useExpenses();

	type Tab = 'transactions' | 'summary' | 'lorenzo' | 'maria';
	let activeTab = $state<Tab>('transactions');
	let showClearModal = $state(false);

	// Loading states for Google Sheets data
	let isLoading = $state(true);
	let loadError = $state<string | null>(null);

	// Fetch data from Google Sheets on mount
	async function fetchTransactions() {
		isLoading = true;
		loadError = null;

		try {
			const response = await fetch('/api/transactions');
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to fetch transactions');
			}

			if (data.transactions && data.transactions.length > 0) {
				// Convert date strings back to Date objects
				const transactions: Transaction[] = data.transactions.map((tx: Transaction & { date: string }) => ({
					...tx,
					date: new Date(tx.date)
				}));
				expenses.replaceAllTransactions(transactions);
			}

			if (data.errors && data.errors.length > 0) {
				console.warn('Parse errors:', data.errors);
			}
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Failed to load data';
			console.error('Error fetching transactions:', error);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		fetchTransactions();
	});

	function handleTabChange(tab: Tab) {
		activeTab = tab;
	}

	function handleClearData() {
		expenses.clearAllTransactions();
		showClearModal = false;
	}

	function handleRefresh() {
		fetchTransactions();
	}
</script>

<svelte:head>
	<title>Despesas - Expense Tracker</title>
</svelte:head>

<div class="min-h-screen bg-themed-secondary transition-theme">
	<!-- Header -->
	<Header transactionCount={expenses.transactions.length} {isLoading} onRefresh={handleRefresh} />

	<!-- Error Banner -->
	{#if loadError}
		<div class="bg-negative/10 border-b border-negative/20 px-4 py-3">
			<div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
				<p class="text-sm text-negative">{loadError}</p>
				<Button variant="ghost" onclick={handleRefresh}>
					<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 2v6h-6"/>
						<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
						<path d="M3 22v-6h6"/>
						<path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
					</svg>
					Retry
				</Button>
			</div>
		</div>
	{/if}

	<!-- Tab Navigation -->
	<TabNav {activeTab} onTabChange={handleTabChange} />

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		{#key activeTab}
			{#if activeTab === 'transactions'}
				<div class="space-y-6 stagger-children">
					<!-- Balance Hero -->
					<BalanceHero monthlyTotals={expenses.monthlyTotals} />

					<!-- Add Transaction Section -->
					<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<div class="lg:col-span-1">
							<CsvImport />
						</div>
						<div class="lg:col-span-2">
							<ExpenseForm />
						</div>
					</div>

					<!-- Transactions List -->
					<TransactionTable />
				</div>
			{:else if activeTab === 'summary'}
				<div class="space-y-6 animate-fade-in">
					<BalanceHero monthlyTotals={expenses.monthlyTotals} />
					<CombinedSummary />
				</div>
			{:else if activeTab === 'lorenzo'}
				<div class="animate-fade-in">
					<IndividualSummary owner="Lorenzo" />
				</div>
			{:else if activeTab === 'maria'}
				<div class="animate-fade-in">
					<IndividualSummary owner="Maria" />
				</div>
			{/if}
		{/key}
	</main>

	<!-- Footer -->
	<footer class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
		<p class="text-sm text-themed-secondary mb-4">
			Despesas - Expense tracking for Lorenzo & Maria
		</p>
		{#if expenses.transactions.length > 0}
			<Button variant="ghost" onclick={() => (showClearModal = true)}>
				<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="3 6 5 6 21 6"/>
					<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
				</svg>
				<span class="text-negative">Clear All Data</span>
			</Button>
		{/if}
	</footer>
</div>

<!-- Clear Data Modal -->
<Modal
	bind:open={showClearModal}
	title="Clear All Data"
	onclose={() => (showClearModal = false)}
	onconfirm={handleClearData}
	confirmText="Delete All"
	confirmVariant="danger"
>
	<p class="text-themed-secondary">
		Are you sure you want to delete all {expenses.transactions.length} transaction{expenses.transactions.length !== 1 ? 's' : ''}? This action cannot be undone.
	</p>
</Modal>
