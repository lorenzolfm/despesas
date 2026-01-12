<script lang="ts">
	import type { Owner, MonthKey } from '$lib/types';
	import { useExpenses } from '$lib/stores/expenses.svelte';
	import { formatBRL, formatMonthYear, formatPercent, getMonthRange, formatDate, getMonthKey } from '$lib/utils/format';
	import { Card, Avatar, Badge, Select } from '$lib/components/ui';

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

	// Selected month state - default to current month
	let selectedMonthValue = $state<string>(monthKeyToString(currentMonthKey));

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
		return { income, credit, total, debt, realSpending, split5050Paid, householdPaid, paidForPartner, personal, settlement };
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

		<!-- Aggregated Stats Grid -->
		<div class="grid grid-cols-2 sm:grid-cols-5 gap-4">
			<div class="p-4 rounded-lg bg-positive/10">
				<p class="text-xs font-medium text-themed-secondary mb-1">Total Income</p>
				<p class="text-lg font-bold font-mono text-positive">{formatBRL(aggregatedTotals.income)}</p>
			</div>
			<div class="p-4 rounded-lg bg-info/10">
				<p class="text-xs font-medium text-themed-secondary mb-1">Total Credit</p>
				<p class="text-lg font-bold font-mono text-info">{formatBRL(aggregatedTotals.credit)}</p>
			</div>
			<div class="p-4 rounded-lg bg-themed-tertiary">
				<p class="text-xs font-medium text-themed-secondary mb-1">Total Paid</p>
				<p class="text-lg font-bold font-mono text-themed">{formatBRL(aggregatedTotals.total)}</p>
			</div>
			<div class="p-4 rounded-lg bg-warning/10">
				<p class="text-xs font-medium text-themed-secondary mb-1">Real Spending</p>
				<p class="text-lg font-bold font-mono text-warning">{formatBRL(aggregatedTotals.realSpending)}</p>
			</div>
			<div class="p-4 rounded-lg {aggregatedTotals.debt > 0 ? 'bg-negative/10' : aggregatedTotals.debt < 0 ? 'bg-positive/10' : 'bg-themed-tertiary'}">
				<p class="text-xs font-medium text-themed-secondary mb-1">Balance</p>
				<p class="text-lg font-bold font-mono {aggregatedTotals.debt > 0 ? 'text-negative' : aggregatedTotals.debt < 0 ? 'text-positive' : 'text-themed'}">
					{aggregatedTotals.debt > 0 ? '-' : aggregatedTotals.debt < 0 ? '+' : ''}{formatBRL(Math.abs(aggregatedTotals.debt))}
				</p>
			</div>
		</div>

		<!-- All-Time Expense Categories -->
		<div class="mt-6 pt-6 border-t border-themed">
			<h4 class="text-sm font-semibold text-themed-secondary uppercase tracking-wide mb-4">All-Time by Category</h4>
			<div class="grid grid-cols-2 sm:grid-cols-5 gap-4">
				<div class="p-3 rounded-lg border border-themed">
					<div class="flex items-center gap-2 mb-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="10"/>
							<line x1="8" y1="12" x2="16" y2="12"/>
						</svg>
						<p class="text-xs font-medium text-themed-secondary">50/50</p>
					</div>
					<p class="text-base font-bold font-mono text-themed">{formatBRL(aggregatedTotals.split5050Paid)}</p>
				</div>
				<div class="p-3 rounded-lg border border-themed">
					<div class="flex items-center gap-2 mb-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-utilities" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
							<polyline points="9 22 9 12 15 12 15 22"/>
						</svg>
						<p class="text-xs font-medium text-themed-secondary">Household</p>
					</div>
					<p class="text-base font-bold font-mono text-themed">{formatBRL(aggregatedTotals.householdPaid)}</p>
				</div>
				<div class="p-3 rounded-lg border border-themed">
					<div class="flex items-center gap-2 mb-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-maria" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
						</svg>
						<p class="text-xs font-medium text-themed-secondary">Paid for {partnerName}</p>
					</div>
					<p class="text-base font-bold font-mono text-themed">{formatBRL(aggregatedTotals.paidForPartner)}</p>
				</div>
				<div class="p-3 rounded-lg border border-themed">
					<div class="flex items-center gap-2 mb-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-themed-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
							<circle cx="12" cy="7" r="4"/>
						</svg>
						<p class="text-xs font-medium text-themed-secondary">Personal</p>
					</div>
					<p class="text-base font-bold font-mono text-themed">{formatBRL(aggregatedTotals.personal)}</p>
				</div>
				<div class="p-3 rounded-lg border border-themed">
					<div class="flex items-center gap-2 mb-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-rent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<line x1="12" y1="1" x2="12" y2="23"/>
							<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
						</svg>
						<p class="text-xs font-medium text-themed-secondary">Settlement</p>
					</div>
					<p class="text-base font-bold font-mono text-rent">{formatBRL(aggregatedTotals.settlement)}</p>
				</div>
			</div>
		</div>
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
				<div class="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
					<div class="p-4 rounded-lg bg-positive/10">
						<p class="text-xs font-medium text-themed-secondary mb-1">Income</p>
						<p class="text-lg font-bold font-mono text-positive">{formatBRL(person.income)}</p>
					</div>
					<div class="p-4 rounded-lg bg-info/10">
						<p class="text-xs font-medium text-themed-secondary mb-1">Credit</p>
						<p class="text-lg font-bold font-mono text-info">{formatBRL(person.credit)}</p>
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

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<!-- 50/50 Split -->
						<div class="p-4 rounded-lg border border-themed">
							<h5 class="font-medium text-themed mb-3 flex items-center gap-2">
								<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<circle cx="12" cy="12" r="10"/>
									<line x1="8" y1="12" x2="16" y2="12"/>
								</svg>
								50/50 Expenses
							</h5>
							<div class="space-y-2 text-sm">
								<div class="flex justify-between">
									<span class="text-themed-secondary">Paid</span>
									<span class="font-mono text-themed">{formatBRL(person.split5050Paid)}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-themed-secondary">Should Pay</span>
									<span class="font-mono text-themed-secondary">{formatBRL(person.split5050Portion)}</span>
								</div>
							</div>
						</div>

						<!-- Household -->
						<div class="p-4 rounded-lg border border-themed">
							<h5 class="font-medium text-themed mb-3 flex items-center gap-2">
								<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-utilities" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
									<polyline points="9 22 9 12 15 12 15 22"/>
								</svg>
								Household ({formatPercent(person.sharePercent)} share)
							</h5>
							<div class="space-y-2 text-sm">
								<div class="flex justify-between">
									<span class="text-themed-secondary">Paid</span>
									<span class="font-mono text-themed">{formatBRL(person.householdPaid)}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-themed-secondary">Should Pay</span>
									<span class="font-mono text-themed-secondary">{formatBRL(person.householdPortion)}</span>
								</div>
							</div>
						</div>

						<!-- Paid for Partner -->
						<div class="p-4 rounded-lg border border-themed">
							<h5 class="font-medium text-themed mb-3 flex items-center gap-2">
								<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-maria" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
								</svg>
								Paid for {partnerName}
							</h5>
							<div class="space-y-2 text-sm">
								<div class="flex justify-between">
									<span class="text-themed-secondary">Amount</span>
									<span class="font-mono text-themed">{formatBRL(person.paidForPartner)}</span>
								</div>
							</div>
						</div>

						<!-- Personal & Settlement -->
						<div class="p-4 rounded-lg border border-themed">
							<h5 class="font-medium text-themed mb-3 flex items-center gap-2">
								<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-themed-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
									<circle cx="12" cy="7" r="4"/>
								</svg>
								Personal & Settlement
							</h5>
							<div class="space-y-2 text-sm">
								<div class="flex justify-between">
									<span class="text-themed-secondary">Personal</span>
									<span class="font-mono text-themed">{formatBRL(person.personal)}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-themed-secondary">Settlement</span>
									<span class="font-mono text-rent">{formatBRL(person.settlement)}</span>
								</div>
							</div>
						</div>
					</div>
				</div>

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
