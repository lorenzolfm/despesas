import type { Transaction, CombinedMonthlyTotals } from '$lib/types';
import { calculateAllMonthlyTotals } from '$lib/utils/calculations';

// Reactive state
let transactions = $state<Transaction[]>([]);
let searchQuery = $state('');

// Derived state
const filteredTransactions = $derived(
	searchQuery.trim()
		? transactions.filter((tx) =>
				tx.description.toLowerCase().includes(searchQuery.toLowerCase())
			)
		: transactions
);

const sortedTransactions = $derived(
	[...filteredTransactions].sort((a, b) => b.date.getTime() - a.date.getTime())
);

const monthlyTotals = $derived<CombinedMonthlyTotals[]>(
	calculateAllMonthlyTotals(transactions)
);

// Actions
function addTransaction(tx: Omit<Transaction, 'id'>): void {
	const newTx: Transaction = {
		...tx,
		id: crypto.randomUUID()
	};
	transactions = [...transactions, newTx];
}

function removeTransaction(id: string): void {
	transactions = transactions.filter((tx) => tx.id !== id);
}

function importTransactions(newTransactions: Transaction[]): void {
	transactions = [...transactions, ...newTransactions];
}

function replaceAllTransactions(newTransactions: Transaction[]): void {
	transactions = newTransactions;
}

function clearAllTransactions(): void {
	transactions = [];
}

function setSearchQuery(query: string): void {
	searchQuery = query;
}

// Export store interface
export function useExpenses() {
	return {
		// Getters (reactive through Svelte's proxy)
		get transactions() {
			return transactions;
		},
		get filteredTransactions() {
			return sortedTransactions;
		},
		get searchQuery() {
			return searchQuery;
		},
		get monthlyTotals() {
			return monthlyTotals;
		},

		// Actions
		addTransaction,
		removeTransaction,
		importTransactions,
		replaceAllTransactions,
		clearAllTransactions,
		setSearchQuery
	};
}
