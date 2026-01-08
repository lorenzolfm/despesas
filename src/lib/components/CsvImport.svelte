<script lang="ts">
	import { parseCSV, type ParseResult } from '$lib/utils/csv';
	import { useExpenses } from '$lib/stores/expenses.svelte';
	import { formatBRL, formatDate } from '$lib/utils/format';

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

<div class="bg-white rounded-lg shadow p-4 mb-4">
	<h2 class="text-lg font-semibold mb-4">Import CSV</h2>

	{#if !parseResult}
		<div
			class="border-2 border-dashed rounded-lg p-8 text-center transition-colors {isDragging
				? 'border-teal-500 bg-teal-50'
				: 'border-gray-300'}"
			ondrop={handleDrop}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			role="button"
			tabindex="0"
		>
			<p class="text-gray-600 mb-2">Drag and drop a CSV file here, or</p>
			<input
				bind:this={fileInput}
				type="file"
				accept=".csv"
				onchange={handleFileSelect}
				class="hidden"
				id="csv-input"
			/>
			<label
				for="csv-input"
				class="inline-block bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md cursor-pointer transition-colors"
			>
				Select File
			</label>
			<p class="text-sm text-gray-500 mt-4">
				Supports CSV with columns: Dono/Owner, Descricao/Description, Valor/Amount, Tipo/Type,
				Data/Date
			</p>
		</div>
	{:else}
		<div class="space-y-4">
			<div
				class="p-4 rounded-lg {parseResult.transactions.length > 0
					? 'bg-green-50'
					: 'bg-yellow-50'}"
			>
				<p class="font-medium {parseResult.transactions.length > 0 ? 'text-green-800' : 'text-yellow-800'}">
					{parseResult.transactions.length} transactions ready to import
				</p>
				{#if parseResult.skipped > 0}
					<p class="text-sm text-yellow-700 mt-1">{parseResult.skipped} rows skipped</p>
				{/if}
			</div>

			{#if parseResult.errors.length > 0}
				<div class="bg-red-50 p-4 rounded-lg">
					<p class="font-medium text-red-800 mb-2">Errors:</p>
					<ul class="text-sm text-red-700 list-disc list-inside max-h-32 overflow-y-auto">
						{#each parseResult.errors.slice(0, 10) as error}
							<li>{error}</li>
						{/each}
						{#if parseResult.errors.length > 10}
							<li>... and {parseResult.errors.length - 10} more errors</li>
						{/if}
					</ul>
				</div>
			{/if}

			{#if parseResult.transactions.length > 0}
				<div>
					<p class="text-sm font-medium text-gray-700 mb-2">Preview (first 5 transactions):</p>
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-3 py-2 text-left">Date</th>
									<th class="px-3 py-2 text-left">Owner</th>
									<th class="px-3 py-2 text-left">Description</th>
									<th class="px-3 py-2 text-left">Type</th>
									<th class="px-3 py-2 text-right">Amount</th>
								</tr>
							</thead>
							<tbody class="divide-y">
								{#each parseResult.transactions.slice(0, 5) as tx}
									<tr>
										<td class="px-3 py-2">{formatDate(tx.date)}</td>
										<td class="px-3 py-2">{tx.owner}</td>
										<td class="px-3 py-2 max-w-xs truncate">{tx.description}</td>
										<td class="px-3 py-2">{tx.type}</td>
										<td class="px-3 py-2 text-right font-mono">{formatBRL(tx.amount)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>

				<div class="flex items-center gap-2">
					<input type="checkbox" id="replace" bind:checked={replaceExisting} class="rounded" />
					<label for="replace" class="text-sm text-gray-700">
						Replace existing transactions (instead of adding to them)
					</label>
				</div>
			{/if}

			<div class="flex gap-2">
				<button
					onclick={handleImport}
					disabled={parseResult.transactions.length === 0}
					class="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
				>
					Import {parseResult.transactions.length} Transactions
				</button>
				<button
					onclick={handleCancel}
					class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
				>
					Cancel
				</button>
			</div>
		</div>
	{/if}
</div>
