<script lang="ts">
	import type { Owner, ExpenseType } from '$lib/types';
	import { EXPENSE_TYPES, OWNERS } from '$lib/types';
	import { useExpenses } from '$lib/stores/expenses.svelte';
	import { formatDateForInput } from '$lib/utils/format';

	const expenses = useExpenses();

	let owner = $state<Owner>('Lorenzo');
	let description = $state('');
	let amount = $state('');
	let type = $state<ExpenseType>('Household');
	let date = $state(formatDateForInput(new Date()));

	let error = $state('');

	function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';

		// Validation
		if (!description.trim()) {
			error = 'Description is required';
			return;
		}

		const parsedAmount = parseFloat(amount.replace(',', '.'));
		if (isNaN(parsedAmount) || parsedAmount <= 0) {
			error = 'Please enter a valid amount';
			return;
		}

		const parsedDate = new Date(date);
		if (isNaN(parsedDate.getTime())) {
			error = 'Please enter a valid date';
			return;
		}

		expenses.addTransaction({
			owner,
			description: description.trim(),
			amount: parsedAmount,
			type,
			date: parsedDate
		});

		// Reset form
		description = '';
		amount = '';
		date = formatDateForInput(new Date());
	}
</script>

<form onsubmit={handleSubmit} class="bg-white rounded-lg shadow p-4 mb-4">
	<h2 class="text-lg font-semibold mb-4">Add Transaction</h2>

	{#if error}
		<div class="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm">
			{error}
		</div>
	{/if}

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		<div>
			<label for="owner" class="block text-sm font-medium text-gray-700 mb-1">Owner</label>
			<select
				id="owner"
				bind:value={owner}
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
			>
				{#each OWNERS as o}
					<option value={o}>{o}</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="type" class="block text-sm font-medium text-gray-700 mb-1">Type</label>
			<select
				id="type"
				bind:value={type}
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
			>
				{#each EXPENSE_TYPES as t}
					<option value={t}>{t}</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="amount" class="block text-sm font-medium text-gray-700 mb-1">Amount (R$)</label>
			<input
				id="amount"
				type="text"
				bind:value={amount}
				placeholder="0.00"
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
			/>
		</div>

		<div class="md:col-span-2 lg:col-span-1">
			<label for="description" class="block text-sm font-medium text-gray-700 mb-1"
				>Description</label
			>
			<input
				id="description"
				type="text"
				bind:value={description}
				placeholder="What was this expense for?"
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
			/>
		</div>

		<div>
			<label for="date" class="block text-sm font-medium text-gray-700 mb-1">Date</label>
			<input
				id="date"
				type="date"
				bind:value={date}
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
			/>
		</div>
	</div>

	<div class="mt-4">
		<button
			type="submit"
			class="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
		>
			Add Transaction
		</button>
	</div>
</form>
