<script lang="ts">
	import type { Owner, ExpenseType, ExpenseCategory } from '$lib/types';
	import { EXPENSE_TYPES, EXPENSE_CATEGORIES, OWNERS } from '$lib/types';
	import { useExpenses } from '$lib/stores/expenses.svelte';
	import { Card, Button, Input, Select, Avatar, DatePicker } from '$lib/components/ui';

	interface Props {
		onSuccess?: () => void;
	}

	let { onSuccess }: Props = $props();

	const expenses = useExpenses();

	let owner = $state<Owner>('Lorenzo');
	let description = $state('');
	let amount = $state('');
	let type = $state<ExpenseType>('Household');
	let category = $state<ExpenseCategory | ''>('');
	let date = $state(new Date());

	let error = $state('');
	let success = $state(false);
	let isSubmitting = $state(false);

	const ownerOptions = OWNERS.map((o) => ({ value: o, label: o }));
	const typeOptions = EXPENSE_TYPES.map((t) => ({ value: t, label: t }));
	const categoryOptions = [
		{ value: '', label: 'No category' },
		...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))
	];

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		success = false;
		isSubmitting = true;

		// Validation
		if (!description.trim()) {
			error = 'Description is required';
			isSubmitting = false;
			return;
		}

		const parsedAmount = parseFloat(amount.replace(',', '.'));
		if (isNaN(parsedAmount) || parsedAmount <= 0) {
			error = 'Please enter a valid amount';
			isSubmitting = false;
			return;
		}

		if (!date || isNaN(date.getTime())) {
			error = 'Please enter a valid date';
			isSubmitting = false;
			return;
		}

		try {
			// Make API call to write to Google Sheets
			const response = await fetch('/api/transactions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					owner,
					description: description.trim(),
					amount: parsedAmount,
					type,
					date: date.toISOString(),
					category: category || undefined
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to save transaction');
			}

			// Reset form and show success
			description = '';
			amount = '';
			category = '';
			date = new Date();
			success = true;

			// Refresh the transactions list from Google Sheets
			onSuccess?.();

			// Hide success message after 3 seconds
			setTimeout(() => {
				success = false;
			}, 3000);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save transaction. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Card>
	<div class="flex items-center gap-3 mb-6">
		<div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
			<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<line x1="12" y1="5" x2="12" y2="19"/>
				<line x1="5" y1="12" x2="19" y2="12"/>
			</svg>
		</div>
		<div>
			<h2 class="text-lg font-semibold text-themed">Add Transaction</h2>
			<p class="text-sm text-themed-secondary">Record a new expense or income</p>
		</div>
	</div>

	{#if error}
		<div class="mb-4 p-3 rounded-lg bg-negative/10 border border-negative/20 flex items-center gap-2">
			<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-negative flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="10"/>
				<line x1="12" y1="8" x2="12" y2="12"/>
				<line x1="12" y1="16" x2="12.01" y2="16"/>
			</svg>
			<span class="text-sm text-negative">{error}</span>
		</div>
	{/if}

	{#if success}
		<div class="mb-4 p-3 rounded-lg bg-positive/10 border border-positive/20 flex items-center gap-2">
			<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-positive flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
				<polyline points="22 4 12 14.01 9 11.01"/>
			</svg>
			<span class="text-sm text-positive">Transaction added successfully!</span>
		</div>
	{/if}

	<form onsubmit={handleSubmit} class="space-y-4">
		<!-- Owner Selection -->
		<fieldset>
			<legend class="block text-sm font-medium text-themed-secondary mb-2">Who paid?</legend>
			<div class="flex gap-3">
				{#each OWNERS as o}
					<button
						type="button"
						onclick={() => (owner = o)}
						disabled={isSubmitting}
						class="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed {owner === o
							? 'border-primary bg-primary/5'
							: 'border-themed hover:border-themed-tertiary bg-themed'}"
					>
						<Avatar name={o} size="sm" color={o === 'Lorenzo' ? 'lorenzo' : 'maria'} />
						<span class="font-medium text-themed">{o}</span>
					</button>
				{/each}
			</div>
		</fieldset>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<Select
				label="Type"
				bind:value={type}
				options={typeOptions}
				required
			/>

			<Input
				type="text"
				label="Amount (R$)"
				bind:value={amount}
				placeholder="0.00"
				required
			/>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<Input
				type="text"
				label="Description"
				bind:value={description}
				placeholder="What was this expense for?"
				required
			/>

			<Select
				label="Category"
				bind:value={category}
				options={categoryOptions}
			/>
		</div>

		<DatePicker
			label="Date"
			bind:value={date}
			disabled={isSubmitting}
			required
		/>

		<div class="pt-2">
			<Button type="submit" fullWidth disabled={isSubmitting}>
				{#if isSubmitting}
					<svg class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Saving...
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="12" y1="5" x2="12" y2="19"/>
						<line x1="5" y1="12" x2="19" y2="12"/>
					</svg>
					Add Transaction
				{/if}
			</Button>
		</div>
	</form>
</Card>
