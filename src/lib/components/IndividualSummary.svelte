<script lang="ts">
	import { untrack } from 'svelte';
	import type { Owner, MonthKey, ExpenseCategory } from '$lib/types';
	import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_EMOJIS } from '$lib/types';
	import { useExpenses } from '$lib/stores/expenses.svelte';
	import { formatBRL, formatMonthYear, formatPercent, getMonthRange, formatDate, getMonthKey } from '$lib/utils/format';
	import { Card, Avatar, Badge, Select, LineChart, PieChart } from '$lib/components/ui';

	interface Props {
		owner: Owner;
	}

	let { owner }: Props = $props();

	const expenses = useExpenses();

	const partnerName = $derived(owner === 'Lorenzo' ? 'Maria' : 'Lorenzo');
	const ownerColor = $derived(owner === 'Lorenzo' ? 'lorenzo' : 'maria');

	// Helper to compare MonthKey objects
	function compareMonthKeys(a: MonthKey, b: MonthKey): number {
		if (a.year !== b.year) return a.year - b.year;
		return a.month - b.month;
	}

	// Helper to convert MonthKey to string for dropdown value
	function monthKeyToString(key: MonthKey): string {
		return `${key.year}-${key.month}`;
	}

	// Helper to parse string back to MonthKey
	function stringToMonthKey(str: string): MonthKey {
		const [year, month] = str.split('-').map(Number);
		return { year, month };
	}

	// Get current month key
	const currentMonthKey = $derived.by(() => getMonthKey(new Date()));

	// All person totals (including future months) sorted newest first
	const allPersonTotals = $derived(
		expenses.monthlyTotals
			.map((month) => (owner === 'Lorenzo' ? month.lorenzo : month.maria))
			.sort((a, b) => compareMonthKeys(b.monthKey, a.monthKey))
	);

	// Person totals up to current month only (for aggregation)
	const personTotalsUpToCurrent = $derived(
		allPersonTotals.filter((person) => compareMonthKeys(person.monthKey, currentMonthKey) <= 0)
	);

	// Selected month state - default to current month (untrack to avoid reactive warning)
	let selectedMonthValue = $state<string>(untrack(() => monthKeyToString(currentMonthKey)));

	// Dropdown options from all months with data
	const monthOptions = $derived(
		allPersonTotals.map((p) => ({
			value: monthKeyToString(p.monthKey),
			label: formatMonthYear(p.monthKey)
		}))
	);

	// Get selected month data
	const selectedMonthData = $derived(
		allPersonTotals.find((p) => monthKeyToString(p.monthKey) === selectedMonthValue)
	);

	// Calculate aggregated totals across all months up to current
	const aggregatedTotals = $derived.by(() => {
		const income = personTotalsUpToCurrent.reduce((sum, p) => sum + p.income, 0);
		const credit = personTotalsUpToCurrent.reduce((sum, p) => sum + p.credit, 0);
		const total = personTotalsUpToCurrent.reduce((sum, p) => sum + p.total, 0);
		const debt = personTotalsUpToCurrent.reduce((sum, p) => sum + p.debt, 0);
		const realSpending = personTotalsUpToCurrent.reduce((sum, p) => sum + p.realSpending, 0);
		const split5050Paid = personTotalsUpToCurrent.reduce((sum, p) => sum + p.split5050Paid, 0);
		const householdPaid = personTotalsUpToCurrent.reduce((sum, p) => sum + p.householdPaid, 0);
		const paidForPartner = personTotalsUpToCurrent.reduce((sum, p) => sum + p.paidForPartner, 0);
		const personal = personTotalsUpToCurrent.reduce((sum, p) => sum + p.personal, 0);
		const settlement = personTotalsUpToCurrent.reduce((sum, p) => sum + p.settlement, 0);
		const revenue = income + credit;
		return { income, credit, revenue, total, debt, realSpending, split5050Paid, householdPaid, paidForPartner, personal, settlement };
	});

	// Aggregated category totals for this person
	const aggregatedCategoryTotals = $derived.by(() => {
		const totals: Record<string, number> = {};
		for (const month of personTotalsUpToCurrent) {
			for (const [category, amount] of Object.entries(month.categoryTotals)) {
				totals[category] = (totals[category] || 0) + amount;
			}
		}
		return totals;
	});

	// Category colors for charts
	const categoryColors: Record<string, string> = {
		'Mercado': '#22c55e',
		'Transporte': '#3b82f6',
		'Água': '#06b6d4',
		'Luz': '#f59e0b',
		'Comida boa': '#ec4899',
		'Filho': '#8b5cf6',
		'Entreterimento': '#f97316',
		'Saúde': '#ef4444',
		'Casa': '#6b7280'
	};

	// Categories for chart selection
	type CategoryKey = 'income' | 'credit' | 'revenue' | 'total' | 'realSpending' | 'split5050Paid' | 'householdPaid' | 'paidForPartner' | 'personal' | 'settlement';

	const chartCategories: { key: CategoryKey; label: string; chartColor: string }[] = [
		{ key: 'income', label: 'Income', chartColor: '#22c55e' },
		{ key: 'credit', label: 'Credit', chartColor: '#3b82f6' },
		{ key: 'revenue', label: 'Total Revenue', chartColor: '#6366f1' },
		{ key: 'total', label: 'Total Paid', chartColor: '#6b7280' },
		{ key: 'realSpending', label: 'Real Spending', chartColor: '#f59e0b' },
		{ key: 'split5050Paid', label: '50/50', chartColor: '#f59e0b' },
		{ key: 'householdPaid', label: 'Household', chartColor: '#8b5cf6' },
		{ key: 'paidForPartner', label: 'Paid for Partner', chartColor: '#ec4899' },
		{ key: 'personal', label: 'Personal', chartColor: '#6b7280' },
		{ key: 'settlement', label: 'Settlement', chartColor: '#ef4444' }
	];

	// Selected category for chart (default to Income)
	let selectedChartCategory = $state<CategoryKey>('income');

	// Get selected category info
	const selectedCategory = $derived(
		chartCategories.find((c) => c.key === selectedChartCategory) || chartCategories[0]
	);

	// Chart data - months sorted oldest to newest
	const chartData = $derived.by(() => {
		const sorted = [...personTotalsUpToCurrent].sort((a, b) => compareMonthKeys(a.monthKey, b.monthKey));
		return {
			labels: sorted.map((m) => formatMonthYear(m.monthKey)),
			data: sorted.map((m) => {
				if (selectedChartCategory === 'revenue') {
					return m.income + m.credit;
				}
				return m[selectedChartCategory];
			})
		};
	});
</script>

<div class="space-y-6">
	<!-- Header + Aggregated Totals Card -->
	<Card>
		<div class="flex items-center gap-4 mb-6">
			<Avatar name={owner} size="xl" color={ownerColor} />
			<div class="flex-1">
				<h2 class="text-2xl font-bold text-themed">{owner}'s Summary</h2>
				<p class="text-themed-secondary">Personal breakdown and debt calculation</p>
			</div>
			{#if aggregatedTotals.debt !== 0}
				<div class="text-right">
					<p class="text-sm text-themed-secondary mb-1">Overall Balance</p>
					<p class="text-xl font-bold font-mono {aggregatedTotals.debt > 0 ? 'text-negative' : 'text-positive'}">
						{aggregatedTotals.debt > 0 ? 'Owes' : 'Owed'} {formatBRL(Math.abs(aggregatedTotals.debt))}
					</p>
				</div>
			{/if}
		</div>

		<!-- Aggregated Stats Grid (Clickable) -->
		<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
			<button
				type="button"
				onclick={() => selectedChartCategory = 'income'}
				class="p-4 rounded-lg bg-positive/10 text-left transition-all {selectedChartCategory === 'income' ? 'ring-2 ring-offset-2 ring-offset-themed ring-[#22c55e]' : 'hover:opacity-80'}"
			>
				<p class="text-xs font-medium text-themed-secondary mb-1">Total Income</p>
				<p class="text-lg font-bold font-mono text-positive">{formatBRL(aggregatedTotals.income)}</p>
			</button>
			<button
				type="button"
				onclick={() => selectedChartCategory = 'credit'}
				class="p-4 rounded-lg bg-info/10 text-left transition-all {selectedChartCategory === 'credit' ? 'ring-2 ring-offset-2 ring-offset-themed ring-[#3b82f6]' : 'hover:opacity-80'}"
			>
				<p class="text-xs font-medium text-themed-secondary mb-1">Total Credit</p>
				<p class="text-lg font-bold font-mono text-info">{formatBRL(aggregatedTotals.credit)}</p>
			</button>
			<button
				type="button"
				onclick={() => selectedChartCategory = 'revenue'}
				class="p-4 rounded-lg bg-primary/10 text-left transition-all {selectedChartCategory === 'revenue' ? 'ring-2 ring-offset-2 ring-offset-themed ring-[#6366f1]' : 'hover:opacity-80'}"
			>
				<p class="text-xs font-medium text-themed-secondary mb-1">Total Revenue</p>
				<p class="text-lg font-bold font-mono text-primary">{formatBRL(aggregatedTotals.revenue)}</p>
			</button>
			<button
				type="button"
				onclick={() => selectedChartCategory = 'total'}
				class="p-4 rounded-lg bg-themed-tertiary text-left transition-all {selectedChartCategory === 'total' ? 'ring-2 ring-offset-2 ring-offset-themed ring-[#6b7280]' : 'hover:opacity-80'}"
			>
				<p class="text-xs font-medium text-themed-secondary mb-1">Total Paid</p>
				<p class="text-lg font-bold font-mono text-themed">{formatBRL(aggregatedTotals.total)}</p>
			</button>
			<button
				type="button"
				onclick={() => selectedChartCategory = 'realSpending'}
				class="p-4 rounded-lg bg-warning/10 text-left transition-all {selectedChartCategory === 'realSpending' ? 'ring-2 ring-offset-2 ring-offset-themed ring-[#f59e0b]' : 'hover:opacity-80'}"
			>
				<p class="text-xs font-medium text-themed-secondary mb-1">Real Spending</p>
				<p class="text-lg font-bold font-mono text-warning">{formatBRL(aggregatedTotals.realSpending)}</p>
			</button>
			<div class="p-4 rounded-lg {aggregatedTotals.debt > 0 ? 'bg-negative/10' : aggregatedTotals.debt < 0 ? 'bg-positive/10' : 'bg-themed-tertiary'}">
				<p class="text-xs font-medium text-themed-secondary mb-1">Balance</p>
				<p class="text-lg font-bold font-mono {aggregatedTotals.debt > 0 ? 'text-negative' : aggregatedTotals.debt < 0 ? 'text-positive' : 'text-themed'}">
					{aggregatedTotals.debt > 0 ? '-' : aggregatedTotals.debt < 0 ? '+' : ''}{formatBRL(Math.abs(aggregatedTotals.debt))}
				</p>
			</div>
		</div>

		<!-- All-Time Expense Categories (Clickable) -->
		<div class="mt-6 pt-6 border-t border-themed">
			<h4 class="text-sm font-semibold text-themed-secondary uppercase tracking-wide mb-4">All-Time by Category</h4>
			<div class="grid grid-cols-2 sm:grid-cols-5 gap-4">
				<button
					type="button"
					onclick={() => selectedChartCategory = 'split5050Paid'}
					class="p-3 rounded-lg border border-themed text-left transition-all {selectedChartCategory === 'split5050Paid' ? 'ring-2 ring-offset-2 ring-offset-themed ring-[#f59e0b]' : 'hover:opacity-80'}"
				>
					<div class="flex items-center gap-2 mb-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="10"/>
							<line x1="8" y1="12" x2="16" y2="12"/>
						</svg>
						<p class="text-xs font-medium text-themed-secondary">50/50</p>
					</div>
					<p class="text-base font-bold font-mono text-themed">{formatBRL(aggregatedTotals.split5050Paid)}</p>
				</button>
				<button
					type="button"
					onclick={() => selectedChartCategory = 'householdPaid'}
					class="p-3 rounded-lg border border-themed text-left transition-all {selectedChartCategory === 'householdPaid' ? 'ring-2 ring-offset-2 ring-offset-themed ring-[#8b5cf6]' : 'hover:opacity-80'}"
				>
					<div class="flex items-center gap-2 mb-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-utilities" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
							<polyline points="9 22 9 12 15 12 15 22"/>
						</svg>
						<p class="text-xs font-medium text-themed-secondary">Household</p>
					</div>
					<p class="text-base font-bold font-mono text-themed">{formatBRL(aggregatedTotals.householdPaid)}</p>
				</button>
				<button
					type="button"
					onclick={() => selectedChartCategory = 'paidForPartner'}
					class="p-3 rounded-lg border border-themed text-left transition-all {selectedChartCategory === 'paidForPartner' ? 'ring-2 ring-offset-2 ring-offset-themed ring-[#ec4899]' : 'hover:opacity-80'}"
				>
					<div class="flex items-center gap-2 mb-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-maria" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
						</svg>
						<p class="text-xs font-medium text-themed-secondary">Paid for {partnerName}</p>
					</div>
					<p class="text-base font-bold font-mono text-themed">{formatBRL(aggregatedTotals.paidForPartner)}</p>
				</button>
				<button
					type="button"
					onclick={() => selectedChartCategory = 'personal'}
					class="p-3 rounded-lg border border-themed text-left transition-all {selectedChartCategory === 'personal' ? 'ring-2 ring-offset-2 ring-offset-themed ring-[#6b7280]' : 'hover:opacity-80'}"
				>
					<div class="flex items-center gap-2 mb-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-themed-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
							<circle cx="12" cy="7" r="4"/>
						</svg>
						<p class="text-xs font-medium text-themed-secondary">Personal</p>
					</div>
					<p class="text-base font-bold font-mono text-themed">{formatBRL(aggregatedTotals.personal)}</p>
				</button>
				<button
					type="button"
					onclick={() => selectedChartCategory = 'settlement'}
					class="p-3 rounded-lg border border-themed text-left transition-all {selectedChartCategory === 'settlement' ? 'ring-2 ring-offset-2 ring-offset-themed ring-[#ef4444]' : 'hover:opacity-80'}"
				>
					<div class="flex items-center gap-2 mb-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-rent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<line x1="12" y1="1" x2="12" y2="23"/>
							<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
						</svg>
						<p class="text-xs font-medium text-themed-secondary">Settlement</p>
					</div>
					<p class="text-base font-bold font-mono text-rent">{formatBRL(aggregatedTotals.settlement)}</p>
				</button>
			</div>
		</div>

		<!-- By Expense Category (All Time) -->
		{#if Object.keys(aggregatedCategoryTotals).length > 0}
			{@const allTimePieData = Object.entries(aggregatedCategoryTotals)
				.filter(([_, amount]) => amount > 0)
				.map(([category, amount]) => ({
					label: `${EXPENSE_CATEGORY_EMOJIS[category as ExpenseCategory]} ${category}`,
					value: amount,
					color: categoryColors[category] || '#6b7280'
				}))}
			<div class="mt-6 pt-6 border-t border-themed">
				<h4 class="text-sm font-semibold text-themed-secondary uppercase tracking-wide mb-4">By Expense Category (All Time)</h4>
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
					<div class="grid grid-cols-2 gap-2">
						{#each EXPENSE_CATEGORIES as cat}
							{@const amount = aggregatedCategoryTotals[cat] || 0}
							{#if amount > 0}
								<div class="p-2 rounded-lg border border-themed flex items-center gap-2">
									<div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: {categoryColors[cat]}"></div>
									<div class="min-w-0">
										<p class="text-xs text-themed-secondary truncate">{EXPENSE_CATEGORY_EMOJIS[cat]} {cat}</p>
										<p class="text-sm font-bold font-mono text-themed">{formatBRL(amount)}</p>
									</div>
								</div>
							{/if}
						{/each}
					</div>
					{#if allTimePieData.length > 0}
						<div class="flex items-center justify-center">
							<PieChart data={allTimePieData} height={200} />
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Chart -->
		{#if chartData.labels.length > 0}
			<div class="mt-6 pt-6 border-t border-themed">
				<h4 class="text-sm font-semibold text-themed-secondary uppercase tracking-wide mb-4">
					{selectedCategory.label} Evolution
				</h4>
				<LineChart
					labels={chartData.labels}
					data={chartData.data}
					label={selectedCategory.label}
					color={selectedCategory.chartColor}
					height={250}
				/>
			</div>
		{/if}
	</Card>

	{#if allPersonTotals.length === 0}
		<Card>
			<div class="py-12 text-center">
				<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-themed-tertiary flex items-center justify-center">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-themed-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"/>
						<line x1="12" y1="8" x2="12" y2="12"/>
						<line x1="12" y1="16" x2="12.01" y2="16"/>
					</svg>
				</div>
				<h3 class="text-lg font-medium text-themed mb-1">No transactions yet</h3>
				<p class="text-themed-secondary">Add transactions to see {owner}'s summary</p>
			</div>
		</Card>
	{:else}
		<!-- Monthly Detail Card -->
		<Card>
			<!-- Month Selector Header -->
			<div class="flex items-center justify-between mb-6">
				<h3 class="text-lg font-semibold text-themed">Monthly Detail</h3>
				<div class="w-48">
					<Select
						bind:value={selectedMonthValue}
						options={monthOptions}
						placeholder="Select month"
					/>
				</div>
			</div>

			{#if selectedMonthData}
				{@const person = selectedMonthData}
				{@const range = getMonthRange(person.monthKey)}
				{@const isCurrentMonth = compareMonthKeys(person.monthKey, currentMonthKey) === 0}
				{@const isFutureMonth = compareMonthKeys(person.monthKey, currentMonthKey) > 0}

				<!-- Month Info -->
				<div class="flex items-center justify-between mb-6">
					<div>
						<p class="text-sm text-themed-secondary">
							{formatDate(range.start)} - {formatDate(range.end)}
						</p>
					</div>
					<div class="flex items-center gap-2">
						<Badge variant="default">{formatPercent(person.sharePercent)} share</Badge>
						{#if isCurrentMonth}
							<Badge variant="success">Current</Badge>
						{:else if isFutureMonth}
							<Badge variant="warning">Future</Badge>
						{/if}
					</div>
				</div>

				<!-- Summary Stats -->
				<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
					<div class="p-4 rounded-lg bg-positive/10">
						<p class="text-xs font-medium text-themed-secondary mb-1">Income</p>
						<p class="text-lg font-bold font-mono text-positive">{formatBRL(person.income)}</p>
					</div>
					<div class="p-4 rounded-lg bg-info/10">
						<p class="text-xs font-medium text-themed-secondary mb-1">Credit</p>
						<p class="text-lg font-bold font-mono text-info">{formatBRL(person.credit)}</p>
					</div>
					<div class="p-4 rounded-lg bg-primary/10">
						<p class="text-xs font-medium text-themed-secondary mb-1">Total Revenue</p>
						<p class="text-lg font-bold font-mono text-primary">{formatBRL(person.income + person.credit)}</p>
					</div>
					<div class="p-4 rounded-lg bg-themed-tertiary">
						<p class="text-xs font-medium text-themed-secondary mb-1">Total Paid</p>
						<p class="text-lg font-bold font-mono text-themed">{formatBRL(person.total)}</p>
					</div>
					<div class="p-4 rounded-lg bg-warning/10">
						<p class="text-xs font-medium text-themed-secondary mb-1">Real Spending</p>
						<p class="text-lg font-bold font-mono text-warning">{formatBRL(person.realSpending)}</p>
					</div>
					<div class="p-4 rounded-lg {person.debt > 0 ? 'bg-negative/10' : person.debt < 0 ? 'bg-positive/10' : 'bg-themed-tertiary'}">
						<p class="text-xs font-medium text-themed-secondary mb-1">Balance</p>
						<p class="text-lg font-bold font-mono {person.debt > 0 ? 'text-negative' : person.debt < 0 ? 'text-positive' : 'text-themed'}">
							{person.debt > 0 ? '-' : person.debt < 0 ? '+' : ''}{formatBRL(Math.abs(person.debt))}
						</p>
					</div>
				</div>

				<!-- Detailed Breakdown -->
				<div class="space-y-4">
					<h4 class="text-sm font-semibold text-themed-secondary uppercase tracking-wide">Detailed Breakdown</h4>

					<div class="grid grid-cols-2 sm:grid-cols-5 gap-4">
						<!-- 50/50 Split -->
						<div class="p-3 rounded-lg border border-themed">
							<div class="flex items-center gap-2 mb-2">
								<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<circle cx="12" cy="12" r="10"/>
									<line x1="8" y1="12" x2="16" y2="12"/>
								</svg>
								<p class="text-xs font-medium text-themed-secondary">50/50</p>
							</div>
							<p class="text-base font-bold font-mono text-themed">{formatBRL(person.split5050Paid)}</p>
						</div>

						<!-- Household -->
						<div class="p-3 rounded-lg border border-themed">
							<div class="flex items-center gap-2 mb-2">
								<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-utilities" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
									<polyline points="9 22 9 12 15 12 15 22"/>
								</svg>
								<p class="text-xs font-medium text-themed-secondary">Household</p>
							</div>
							<p class="text-base font-bold font-mono text-themed">{formatBRL(person.householdPaid)}</p>
						</div>

						<!-- Paid for Partner -->
						<div class="p-3 rounded-lg border border-themed">
							<div class="flex items-center gap-2 mb-2">
								<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-maria" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
								</svg>
								<p class="text-xs font-medium text-themed-secondary">Paid for {partnerName}</p>
							</div>
							<p class="text-base font-bold font-mono text-themed">{formatBRL(person.paidForPartner)}</p>
						</div>

						<!-- Personal -->
						<div class="p-3 rounded-lg border border-themed">
							<div class="flex items-center gap-2 mb-2">
								<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-themed-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
									<circle cx="12" cy="7" r="4"/>
								</svg>
								<p class="text-xs font-medium text-themed-secondary">Personal</p>
							</div>
							<p class="text-base font-bold font-mono text-themed">{formatBRL(person.personal)}</p>
						</div>

						<!-- Settlement -->
						<div class="p-3 rounded-lg border border-themed">
							<div class="flex items-center gap-2 mb-2">
								<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-rent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<line x1="12" y1="1" x2="12" y2="23"/>
									<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
								</svg>
								<p class="text-xs font-medium text-themed-secondary">Settlement</p>
							</div>
							<p class="text-base font-bold font-mono text-rent">{formatBRL(person.settlement)}</p>
						</div>
					</div>
				</div>

				<!-- By Category (Monthly) with Pie Chart -->
				{#if Object.keys(person.categoryTotals).length > 0}
					{@const pieData = Object.entries(person.categoryTotals)
						.filter(([_, amount]) => amount > 0)
						.map(([category, amount]) => ({
							label: `${EXPENSE_CATEGORY_EMOJIS[category as ExpenseCategory]} ${category}`,
							value: amount,
							color: categoryColors[category] || '#6b7280'
						}))}
					<div class="mt-6 space-y-4">
						<h4 class="text-sm font-semibold text-themed-secondary uppercase tracking-wide">By Expense Category</h4>
						<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
							<div class="grid grid-cols-2 gap-2">
								{#each EXPENSE_CATEGORIES as cat}
									{@const amount = person.categoryTotals[cat] || 0}
									{#if amount > 0}
										<div class="p-2 rounded-lg border border-themed flex items-center gap-2">
											<div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: {categoryColors[cat]}"></div>
											<div class="min-w-0">
												<p class="text-xs text-themed-secondary truncate">{EXPENSE_CATEGORY_EMOJIS[cat]} {cat}</p>
												<p class="text-sm font-bold font-mono text-themed">{formatBRL(amount)}</p>
											</div>
										</div>
									{/if}
								{/each}
							</div>
							{#if pieData.length > 0}
								<div class="flex items-center justify-center">
									<PieChart data={pieData} height={200} />
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Debt Result -->
				<div class="mt-6 p-4 rounded-xl {person.debt > 0 ? 'bg-negative/10 border border-negative/20' : person.debt < 0 ? 'bg-positive/10 border border-positive/20' : 'bg-themed-secondary'}">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							{#if person.debt > 0}
								<div class="w-10 h-10 rounded-full bg-negative/20 flex items-center justify-center">
									<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-negative" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<line x1="12" y1="5" x2="12" y2="19"/>
										<polyline points="19 12 12 19 5 12"/>
									</svg>
								</div>
								<div>
									<p class="font-semibold text-negative">{owner} owes {partnerName}</p>
									<p class="text-sm text-themed-secondary">For this month</p>
								</div>
							{:else if person.debt < 0}
								<div class="w-10 h-10 rounded-full bg-positive/20 flex items-center justify-center">
									<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-positive" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<line x1="12" y1="19" x2="12" y2="5"/>
										<polyline points="5 12 12 5 19 12"/>
									</svg>
								</div>
								<div>
									<p class="font-semibold text-positive">{partnerName} owes {owner}</p>
									<p class="text-sm text-themed-secondary">For this month</p>
								</div>
							{:else}
								<div class="w-10 h-10 rounded-full bg-themed-tertiary flex items-center justify-center">
									<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
										<polyline points="22 4 12 14.01 9 11.01"/>
									</svg>
								</div>
								<div>
									<p class="font-semibold text-themed">All settled!</p>
									<p class="text-sm text-themed-secondary">For this month</p>
								</div>
							{/if}
						</div>
						<p class="text-2xl font-bold font-mono {person.debt > 0 ? 'text-negative' : person.debt < 0 ? 'text-positive' : 'text-themed'}">
							{formatBRL(Math.abs(person.debt))}
						</p>
					</div>
				</div>
			{/if}
		</Card>
	{/if}
</div>
