<script lang="ts">
	import ExpenseForm from '$lib/components/ExpenseForm.svelte';
	import TransactionTable from '$lib/components/TransactionTable.svelte';
	import CsvImport from '$lib/components/CsvImport.svelte';
	import CombinedSummary from '$lib/components/CombinedSummary.svelte';
	import IndividualSummary from '$lib/components/IndividualSummary.svelte';
	import { useExpenses } from '$lib/stores/expenses.svelte';

	const expenses = useExpenses();

	type Tab = 'transactions' | 'summary' | 'lorenzo' | 'maria';
	let activeTab = $state<Tab>('transactions');

	const tabs: { id: Tab; label: string }[] = [
		{ id: 'transactions', label: 'Transactions' },
		{ id: 'summary', label: 'Summary' },
		{ id: 'lorenzo', label: 'Lorenzo' },
		{ id: 'maria', label: 'Maria' }
	];
</script>

<svelte:head>
	<title>Expense Tracker</title>
</svelte:head>

<div class="min-h-screen bg-gray-100">
	<!-- Header -->
	<header class="bg-white shadow-sm">
		<div class="max-w-7xl mx-auto px-4 py-4">
			<div class="flex items-center justify-between">
				<h1 class="text-2xl font-bold text-teal-600">Expense Tracker</h1>
				<div class="text-sm text-gray-500">
					{expenses.transactions.length} transaction{expenses.transactions.length !== 1 ? 's' : ''}
				</div>
			</div>

			<!-- Tabs -->
			<nav class="mt-4 flex gap-1 border-b border-gray-200">
				{#each tabs as tab}
					<button
						onclick={() => (activeTab = tab.id)}
						class="px-4 py-2 text-sm font-medium transition-colors relative {activeTab === tab.id
							? 'text-teal-600'
							: 'text-gray-500 hover:text-gray-700'}"
					>
						{tab.label}
						{#if activeTab === tab.id}
							<span class="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"></span>
						{/if}
					</button>
				{/each}
			</nav>
		</div>
	</header>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto px-4 py-6">
		{#if activeTab === 'transactions'}
			<div class="space-y-4">
				<CsvImport />
				<ExpenseForm />
				<TransactionTable />
			</div>
		{:else if activeTab === 'summary'}
			<CombinedSummary />
		{:else if activeTab === 'lorenzo'}
			<IndividualSummary owner="Lorenzo" />
		{:else if activeTab === 'maria'}
			<IndividualSummary owner="Maria" />
		{/if}
	</main>

	<!-- Footer -->
	<footer class="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
		<p>Expense Tracker - Local network app for Lorenzo & Maria</p>
		{#if expenses.transactions.length > 0}
			<button
				onclick={() => {
					if (confirm('Are you sure you want to clear all transactions?')) {
						expenses.clearAllTransactions();
					}
				}}
				class="mt-2 text-red-500 hover:text-red-700"
			>
				Clear All Data
			</button>
		{/if}
	</footer>
</div>
