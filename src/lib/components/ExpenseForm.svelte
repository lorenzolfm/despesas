<script lang="ts">
	import type { Owner, ExpenseType } from '$lib/types';
	import { EXPENSE_TYPES, OWNERS } from '$lib/types';
	import { useExpenses } from '$lib/stores/expenses.svelte';
	import { formatDateForInput } from '$lib/utils/format';
	import { Card, Button, Input, Select, Avatar } from '$lib/components/ui';

	const expenses = useExpenses();

	let owner = $state<Owner>('Lorenzo');
	let description = $state('');
	let amount = $state('');
	let type = $state<ExpenseType>('Household');
	let date = $state(formatDateForInput(new Date()));

	let error = $state('');
	let success = $state(false);

	const ownerOptions = OWNERS.map((o) => ({ value: o, label: o }));
	const typeOptions = EXPENSE_TYPES.map((t) => ({ value: t, label: t }));

	function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		success = false;

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

		// Reset form and show success
		description = '';
		amount = '';
		date = formatDateForInput(new Date());
		success = true;

		// Hide success message after 3 seconds
		setTimeout(() => {
			success = false;
		}, 3000);
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
						class="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all {owner === o
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

		<Input
			type="text"
			label="Description"
			bind:value={description}
			placeholder="What was this expense for?"
			required
		/>

		<Input
			type="date"
			label="Date"
			bind:value={date}
			required
		/>

		<div class="pt-2">
			<Button type="submit" fullWidth>
				<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<line x1="12" y1="5" x2="12" y2="19"/>
					<line x1="5" y1="12" x2="19" y2="12"/>
				</svg>
				Add Transaction
			</Button>
		</div>
	</form>
</Card>
