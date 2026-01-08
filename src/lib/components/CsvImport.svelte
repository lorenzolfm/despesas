<script lang="ts">
	import { parseCSV, type ParseResult } from '$lib/utils/csv';
	import { useExpenses } from '$lib/stores/expenses.svelte';
	import { formatBRL, formatDate } from '$lib/utils/format';
	import { Card, Button, Badge, Avatar } from '$lib/components/ui';

	const expenses = useExpenses();

	let fileInput: HTMLInputElement;
	let parseResult = $state<ParseResult | null>(null);
	let isDragging = $state(false);
	let replaceExisting = $state(false);

	function handleFile(file: File) {
		const reader = new FileReader();
		reader.onload = (e) => {
			const content = e.target?.result as string;
			parseResult = parseCSV(content);
		};
		reader.readAsText(file);
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			handleFile(file);
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		const file = e.dataTransfer?.files[0];
		if (file && file.name.endsWith('.csv')) {
			handleFile(file);
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function handleImport() {
		if (!parseResult || parseResult.transactions.length === 0) return;

		if (replaceExisting) {
			expenses.replaceAllTransactions(parseResult.transactions);
		} else {
			expenses.importTransactions(parseResult.transactions);
		}

		parseResult = null;
		if (fileInput) {
			fileInput.value = '';
		}
	}

	function handleCancel() {
		parseResult = null;
		if (fileInput) {
			fileInput.value = '';
		}
	}
</script>

<Card>
	<div class="flex items-center gap-3 mb-4">
		<div class="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
			<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
				<polyline points="17 8 12 3 7 8"/>
				<line x1="12" y1="3" x2="12" y2="15"/>
			</svg>
		</div>
		<div>
			<h2 class="text-base font-semibold text-themed">Import CSV</h2>
			<p class="text-xs text-themed-secondary">Upload transactions from a file</p>
		</div>
	</div>

	{#if !parseResult}
		<div
			class="border-2 border-dashed rounded-xl p-6 text-center transition-all {isDragging
				? 'border-primary bg-primary/5'
				: 'border-themed hover:border-primary/50'}"
			ondrop={handleDrop}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			role="button"
			tabindex="0"
		>
			<div class="w-12 h-12 mx-auto mb-3 rounded-full bg-themed-tertiary flex items-center justify-center">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-themed-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
					<polyline points="14 2 14 8 20 8"/>
					<line x1="16" y1="13" x2="8" y2="13"/>
					<line x1="16" y1="17" x2="8" y2="17"/>
					<polyline points="10 9 9 9 8 9"/>
				</svg>
			</div>
			<p class="text-sm text-themed-secondary mb-3">
				Drag and drop a CSV file here
			</p>
			<input
				bind:this={fileInput}
				type="file"
				accept=".csv"
				onchange={handleFileSelect}
				class="hidden"
				id="csv-input"
			/>
			<label for="csv-input">
				<Button variant="secondary" size="sm">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
						<polyline points="17 8 12 3 7 8"/>
						<line x1="12" y1="3" x2="12" y2="15"/>
					</svg>
					Choose File
				</Button>
			</label>
		</div>
	{:else}
		<div class="space-y-4">
			<!-- Status -->
			<div class="p-4 rounded-lg {parseResult.transactions.length > 0 ? 'bg-positive/10' : 'bg-warning/10'}">
				<div class="flex items-center gap-2">
					{#if parseResult.transactions.length > 0}
						<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-positive" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
							<polyline points="22 4 12 14.01 9 11.01"/>
						</svg>
						<span class="font-medium text-positive">
							{parseResult.transactions.length} transactions ready
						</span>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="10"/>
							<line x1="12" y1="8" x2="12" y2="12"/>
							<line x1="12" y1="16" x2="12.01" y2="16"/>
						</svg>
						<span class="font-medium text-warning">No valid transactions found</span>
					{/if}
				</div>
				{#if parseResult.skipped > 0}
					<p class="text-sm text-themed-secondary mt-1">
						{parseResult.skipped} rows skipped
					</p>
				{/if}
			</div>

			<!-- Errors -->
			{#if parseResult.errors.length > 0}
				<div class="p-4 rounded-lg bg-negative/10">
					<p class="font-medium text-negative text-sm mb-2">Errors found:</p>
					<ul class="text-xs text-negative space-y-1 max-h-24 overflow-y-auto">
						{#each parseResult.errors.slice(0, 5) as error}
							<li class="flex items-start gap-1">
								<span class="mt-0.5">-</span>
								<span>{error}</span>
							</li>
						{/each}
						{#if parseResult.errors.length > 5}
							<li class="text-negative/70">... and {parseResult.errors.length - 5} more</li>
						{/if}
					</ul>
				</div>
			{/if}

			<!-- Preview -->
			{#if parseResult.transactions.length > 0}
				<div>
					<p class="text-sm font-medium text-themed-secondary mb-2">Preview:</p>
					<div class="space-y-2 max-h-40 overflow-y-auto">
						{#each parseResult.transactions.slice(0, 3) as tx}
							<div class="flex items-center gap-3 p-2 rounded-lg bg-themed-secondary">
								<Avatar name={tx.owner} size="sm" color={tx.owner === 'Lorenzo' ? 'lorenzo' : 'maria'} />
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-themed truncate">{tx.description}</p>
									<p class="text-xs text-themed-secondary">{formatDate(tx.date)}</p>
								</div>
								<span class="text-sm font-mono text-themed">{formatBRL(tx.amount)}</span>
							</div>
						{/each}
						{#if parseResult.transactions.length > 3}
							<p class="text-xs text-themed-tertiary text-center">
								+{parseResult.transactions.length - 3} more transactions
							</p>
						{/if}
					</div>
				</div>

				<!-- Replace checkbox -->
				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={replaceExisting}
						class="w-4 h-4 rounded border-themed text-primary focus:ring-primary"
					/>
					<span class="text-sm text-themed-secondary">
						Replace existing transactions
					</span>
				</label>
			{/if}

			<!-- Actions -->
			<div class="flex gap-2">
				<Button
					onclick={handleImport}
					disabled={parseResult.transactions.length === 0}
					fullWidth
				>
					Import {parseResult.transactions.length} Transactions
				</Button>
				<Button variant="secondary" onclick={handleCancel}>
					Cancel
				</Button>
			</div>
		</div>
	{/if}
</Card>
