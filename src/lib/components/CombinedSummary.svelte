<script lang="ts">
	import type { MonthKey } from '$lib/types';
	import { useExpenses } from '$lib/stores/expenses.svelte';
	import { formatBRL, formatMonthYear, getMonthRange, formatDate, getMonthKey } from '$lib/utils/format';
	import { Card, Avatar, Badge, Select, LineChart } from '$lib/components/ui';

	const expenses = useExpenses();

	// Helper to compare MonthKey objects
	function compareMonthKeys(a: MonthKey, b: MonthKey): number {
		if (a.year !== b.year) return a.year - b.year;
		return a.month - b.month;
	}

	// Helper to convert MonthKey to string for dropdown value
	function monthKeyToString(key: MonthKey): string {
		return `${key.year}-${key.month}`;
	}

	// Get current month key
	const currentMonthKey = $derived.by(() => getMonthKey(new Date()));

	// All monthly totals sorted newest first
	const allMonthlyTotals = $derived(
		[...expenses.monthlyTotals].sort((a, b) => compareMonthKeys(b.monthKey, a.monthKey))
	);

	// Monthly totals up to current month only (for aggregation)
	const monthlyTotalsUpToCurrent = $derived(
		allMonthlyTotals.filter((month) => compareMonthKeys(month.monthKey, currentMonthKey) <= 0)
	);

	// Selected month state - default to current month
	let selectedMonthValue = $state<string>(monthKeyToString(currentMonthKey));

	// Dropdown options from all months with data
	const monthOptions = $derived(
		allMonthlyTotals.map((m) => ({
			value: monthKeyToString(m.monthKey),
			label: formatMonthYear(m.monthKey)
		}))
	);

	// Get selected month data
	const selectedMonthData = $derived(
		allMonthlyTotals.find((m) => monthKeyToString(m.monthKey) === selectedMonthValue)
	);

	// Calculate aggregated totals across all months up to current
	const aggregatedTotals = $derived({
		totalIncome: monthlyTotalsUpToCurrent.reduce((sum, m) => sum + m.totalIncome, 0),
		totalCredit: monthlyTotalsUpToCurrent.reduce((sum, m) => sum + m.totalCredit, 0),
		totalSplit5050: monthlyTotalsUpToCurrent.reduce((sum, m) => sum + m.totalSplit5050, 0),
		totalPaidForPartner: monthlyTotalsUpToCurrent.reduce((sum, m) => sum + m.totalPaidForPartner, 0),
		totalHousehold: monthlyTotalsUpToCurrent.reduce((sum, m) => sum + m.totalHousehold, 0),
		totalPersonal: monthlyTotalsUpToCurrent.reduce((sum, m) => sum + m.totalPersonal, 0),
		grandTotal: monthlyTotalsUpToCurrent.reduce((sum, m) => sum + m.grandTotal, 0),
		lorenzoIncome: monthlyTotalsUpToCurrent.reduce((sum, m) => sum + m.lorenzo.income, 0),
		mariaIncome: monthlyTotalsUpToCurrent.reduce((sum, m) => sum + m.maria.income, 0)
	});

	// Calculate aggregated share percentages
	const aggregatedShares = $derived(() => {
		const totalIncome = aggregatedTotals.lorenzoIncome + aggregatedTotals.mariaIncome;
		if (totalIncome === 0) {
			return { lorenzo: 50, maria: 50 };
		}
		return {
			lorenzo: Math.round((aggregatedTotals.lorenzoIncome / totalIncome) * 100),
			maria: Math.round((aggregatedTotals.mariaIncome / totalIncome) * 100)
		};
	});

	// Expense categories for breakdown
	const categories = [
		{ key: 'totalIncome', label: 'Income', color: 'text-positive', bgColor: 'bg-positive/10', chartColor: '#22c55e' },
		{ key: 'totalCredit', label: 'Credit', color: 'text-info', bgColor: 'bg-info/10', chartColor: '#3b82f6' },
		{ key: 'totalSplit5050', label: 'Split 50/50', color: 'text-warning', bgColor: 'bg-warning/10', chartColor: '#f59e0b' },
		{ key: 'totalPaidForPartner', label: 'Paid for Partner', color: 'text-maria', bgColor: 'bg-maria/10', chartColor: '#ec4899' },
		{ key: 'totalHousehold', label: 'Household', color: 'text-utilities', bgColor: 'bg-utilities/10', chartColor: '#8b5cf6' },
		{ key: 'totalPersonal', label: 'Personal', color: 'text-themed-secondary', bgColor: 'bg-themed-tertiary', chartColor: '#6b7280' }
	] as const;

	// Selected category for chart (default to Income)
	let selectedChartCategory = $state<(typeof categories)[number]['key']>('totalIncome');

	// Get selected category info
	const selectedCategory = $derived(
		categories.find((c) => c.key === selectedChartCategory) || categories[0]
	);

	// Chart data - months sorted oldest to newest
	const chartData = $derived.by(() => {
		const sorted = [...monthlyTotalsUpToCurrent].sort((a, b) => compareMonthKeys(a.monthKey, b.monthKey));
		return {
			labels: sorted.map((m) => formatMonthYear(m.monthKey)),
			data: sorted.map((m) => m[selectedChartCategory])
		};
	});
</script>

<div class="space-y-6">
	<!-- Header + Aggregated Totals Card -->
	<Card>
		<div class="flex items-center gap-4 mb-6">
			<div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<line x1="18" y1="20" x2="18" y2="10"/>
					<line x1="12" y1="20" x2="12" y2="4"/>
					<line x1="6" y1="20" x2="6" y2="14"/>
				</svg>
			</div>
			<div class="flex-1">
				<h2 class="text-2xl font-bold text-themed">Combined Summary</h2>
				<p class="text-themed-secondary">Household totals and breakdown</p>
			</div>
			<div class="text-right">
				<p class="text-sm text-themed-secondary mb-1">Grand Total</p>
				<p class="text-xl font-bold font-mono text-themed">{formatBRL(aggregatedTotals.grandTotal)}</p>
			</div>
		</div>

		<!-- Aggregated Category Breakdown (Clickable) -->
		<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
			{#each categories as cat}
				{@const value = aggregatedTotals[cat.key]}
				{@const isSelected = selectedChartCategory === cat.key}
				<button
					type="button"
					onclick={() => selectedChartCategory = cat.key}
					class="p-3 rounded-lg {cat.bgColor} text-left transition-all {isSelected ? 'ring-2 ring-offset-2 ring-offset-themed' : 'hover:opacity-80'}"
					style={isSelected ? `--tw-ring-color: ${cat.chartColor}` : ''}
				>
					<p class="text-xs font-medium text-themed-secondary mb-1">{cat.label}</p>
					<p class="text-sm font-semibold font-mono {cat.color}">
						{formatBRL(value)}
					</p>
				</button>
			{/each}
		</div>

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

		<!-- Aggregated Income Shares -->
		{#if aggregatedTotals.totalIncome > 0}
			<div class="mt-6 pt-6 border-t border-themed">
				<p class="text-sm text-themed-secondary mb-3">Income Share (all months)</p>
				<div class="grid grid-cols-2 gap-4">
					<div class="flex items-center gap-3 p-3 rounded-lg bg-lorenzo/10">
						<Avatar name="Lorenzo" size="sm" color="lorenzo" />
						<div>
							<p class="text-sm font-medium text-themed">Lorenzo</p>
							<p class="text-lg font-bold text-lorenzo">{aggregatedShares().lorenzo}%</p>
						</div>
					</div>
					<div class="flex items-center gap-3 p-3 rounded-lg bg-maria/10">
						<Avatar name="Maria" size="sm" color="maria" />
						<div>
							<p class="text-sm font-medium text-themed">Maria</p>
							<p class="text-lg font-bold text-maria">{aggregatedShares().maria}%</p>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</Card>

	{#if allMonthlyTotals.length === 0}
		<Card>
			<div class="py-12 text-center">
				<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-themed-tertiary flex items-center justify-center">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-themed-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="20" x2="18" y2="10"/>
						<line x1="12" y1="20" x2="12" y2="4"/>
						<line x1="6" y1="20" x2="6" y2="14"/>
					</svg>
				</div>
				<h3 class="text-lg font-medium text-themed mb-1">No data yet</h3>
				<p class="text-themed-secondary">Add transactions to see your monthly summary</p>
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
				{@const month = selectedMonthData}
				{@const range = getMonthRange(month.monthKey)}
				{@const isCurrentMonth = compareMonthKeys(month.monthKey, currentMonthKey) === 0}
				{@const isFutureMonth = compareMonthKeys(month.monthKey, currentMonthKey) > 0}

				<!-- Month Info -->
				<div class="flex items-center justify-between mb-6">
					<div>
						<p class="text-sm text-themed-secondary">
							{formatDate(range.start)} - {formatDate(range.end)}
						</p>
					</div>
					<div class="flex items-center gap-2">
						{#if isCurrentMonth}
							<Badge variant="success">Current</Badge>
						{:else if isFutureMonth}
							<Badge variant="warning">Future</Badge>
						{/if}
					</div>
				</div>

				<!-- Category Breakdown -->
				<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
					{#each categories as cat}
						{@const value = month[cat.key]}
						<div class="p-3 rounded-lg {cat.bgColor}">
							<p class="text-xs font-medium text-themed-secondary mb-1">{cat.label}</p>
							<p class="text-sm font-semibold font-mono {cat.color}">
								{formatBRL(value)}
							</p>
						</div>
					{/each}
				</div>

				<!-- Total -->
				<div class="p-4 rounded-lg bg-themed-secondary flex items-center justify-between mb-6">
					<span class="font-medium text-themed">Total Expenses</span>
					<span class="text-xl font-bold font-mono text-themed">{formatBRL(month.grandTotal)}</span>
				</div>

				<!-- Person Breakdown -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<!-- Lorenzo -->
					<div class="p-4 rounded-xl border-2 border-lorenzo/20 bg-lorenzo/5">
						<div class="flex items-center gap-3 mb-4">
							<Avatar name="Lorenzo" size="lg" color="lorenzo" />
							<div>
								<h4 class="font-semibold text-themed">Lorenzo</h4>
								<p class="text-sm text-themed-secondary">
									{Math.round(month.lorenzo.sharePercent * 100)}% share
								</p>
							</div>
						</div>
						<div class="space-y-2 text-sm">
							<div class="flex justify-between">
								<span class="text-themed-secondary">Income</span>
								<span class="font-mono text-positive">{formatBRL(month.lorenzo.income)}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-themed-secondary">Total Paid</span>
								<span class="font-mono text-themed">{formatBRL(month.lorenzo.total)}</span>
							</div>
							<div class="flex justify-between pt-2 border-t border-themed">
								<span class="font-medium text-themed">Balance</span>
								<span class="font-mono font-semibold {month.lorenzo.debt > 0 ? 'text-negative' : month.lorenzo.debt < 0 ? 'text-positive' : 'text-themed'}">
									{#if month.lorenzo.debt > 0}
										Owes {formatBRL(month.lorenzo.debt)}
									{:else if month.lorenzo.debt < 0}
										Owed {formatBRL(Math.abs(month.lorenzo.debt))}
									{:else}
										Settled
									{/if}
								</span>
							</div>
						</div>
					</div>

					<!-- Maria -->
					<div class="p-4 rounded-xl border-2 border-maria/20 bg-maria/5">
						<div class="flex items-center gap-3 mb-4">
							<Avatar name="Maria" size="lg" color="maria" />
							<div>
								<h4 class="font-semibold text-themed">Maria</h4>
								<p class="text-sm text-themed-secondary">
									{Math.round(month.maria.sharePercent * 100)}% share
								</p>
							</div>
						</div>
						<div class="space-y-2 text-sm">
							<div class="flex justify-between">
								<span class="text-themed-secondary">Income</span>
								<span class="font-mono text-positive">{formatBRL(month.maria.income)}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-themed-secondary">Total Paid</span>
								<span class="font-mono text-themed">{formatBRL(month.maria.total)}</span>
							</div>
							<div class="flex justify-between pt-2 border-t border-themed">
								<span class="font-medium text-themed">Balance</span>
								<span class="font-mono font-semibold {month.maria.debt > 0 ? 'text-negative' : month.maria.debt < 0 ? 'text-positive' : 'text-themed'}">
									{#if month.maria.debt > 0}
										Owes {formatBRL(month.maria.debt)}
									{:else if month.maria.debt < 0}
										Owed {formatBRL(Math.abs(month.maria.debt))}
									{:else}
										Settled
									{/if}
								</span>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</Card>
	{/if}
</div>
