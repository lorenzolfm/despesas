<script lang="ts">
    import { untrack } from "svelte";
    import type { ExpenseCategory, MonthKey, Owner } from "$lib/types";
    import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_EMOJIS } from "$lib/types";
    import { useExpenses } from "$lib/stores/expenses.svelte";
    import {
        formatBRL,
        formatDate,
        formatMonthYear,
        formatPercent,
        getMonthKey,
        getMonthRange,
    } from "$lib/utils/format";
    import {
        Avatar,
        Badge,
        Card,
        LineChart,
        PieChart,
        SankeyChart,
        Select,
    } from "$lib/components/ui";
    import { transformPersonToSankeyData } from "$lib/utils/sankey";

    interface Props {
        owner: Owner;
    }

    let { owner }: Props = $props();

    const expenses = useExpenses();

    const partnerName = $derived(owner === "Lorenzo" ? "Maria" : "Lorenzo");
    const ownerColor = $derived(owner === "Lorenzo" ? "lorenzo" : "maria");

    // Helper to compare MonthKey objects
    function compareMonthKeys(a: MonthKey, b: MonthKey): number {
        if (a.year !== b.year) {
            return a.year - b.year;
        }
        return a.month - b.month;
    }

    // Helper to convert MonthKey to string for dropdown value
    function monthKeyToString(key: MonthKey): string {
        return `${key.year}-${key.month}`;
    }

    // Get current month key
    const currentMonthKey = $derived.by(() => getMonthKey(new Date()));

    // All person totals (including future months) sorted newest first
    const allPersonTotals = $derived(
        expenses.monthlyTotals
            .map((month) => (owner === "Lorenzo" ? month.lorenzo : month.maria))
            .sort((a, b) => compareMonthKeys(b.monthKey, a.monthKey)),
    );

    // Person totals up to current month only (for aggregation)
    const personTotalsUpToCurrent = $derived(
        allPersonTotals.filter(
            (person) => compareMonthKeys(person.monthKey, currentMonthKey) <= 0,
        ),
    );

    // Selected month state - default to current month (untrack to avoid reactive warning)
    let selectedMonthValue = $state<string>(
        untrack(() => monthKeyToString(currentMonthKey)),
    );

    // Dropdown options from all months with data
    const monthOptions = $derived(
        allPersonTotals.map((p) => ({
            value: monthKeyToString(p.monthKey),
            label: formatMonthYear(p.monthKey),
        })),
    );

    // Get selected month data
    const selectedMonthData = $derived(
        allPersonTotals.find(
            (p) => monthKeyToString(p.monthKey) === selectedMonthValue,
        ),
    );

    // Get previous month data (for MoM badges)
    const previousMonthData = $derived.by(() => {
        if (!selectedMonthData) {
            return undefined;
        }
        const { year, month } = selectedMonthData.monthKey;
        const prevKey =
            month === 0
                ? { year: year - 1, month: 11 }
                : { year, month: month - 1 };
        return allPersonTotals.find(
            (p) =>
                p.monthKey.year === prevKey.year &&
                p.monthKey.month === prevKey.month,
        );
    });

    function calcPctChange(current: number, previous: number): number | null {
        if (previous === 0) {
            return null;
        }
        return ((current - previous) / previous) * 100;
    }

    // Calculate aggregated totals across all months up to current
    const aggregatedTotals = $derived.by(() => {
        const income = personTotalsUpToCurrent.reduce(
            (sum, p) => sum + p.income,
            0,
        );
        const credit = personTotalsUpToCurrent.reduce(
            (sum, p) => sum + p.credit,
            0,
        );
        const total = personTotalsUpToCurrent.reduce(
            (sum, p) => sum + p.total,
            0,
        );
        const debt = personTotalsUpToCurrent.reduce(
            (sum, p) => sum + p.debt,
            0,
        );
        const realSpending = personTotalsUpToCurrent.reduce(
            (sum, p) => sum + p.realSpending,
            0,
        );
        const split5050Paid = personTotalsUpToCurrent.reduce(
            (sum, p) => sum + p.split5050Paid,
            0,
        );
        const householdPaid = personTotalsUpToCurrent.reduce(
            (sum, p) => sum + p.householdPaid,
            0,
        );
        const paidForPartner = personTotalsUpToCurrent.reduce(
            (sum, p) => sum + p.paidForPartner,
            0,
        );
        const personal = personTotalsUpToCurrent.reduce(
            (sum, p) => sum + p.personal,
            0,
        );
        const settlement = personTotalsUpToCurrent.reduce(
            (sum, p) => sum + p.settlement,
            0,
        );
        const split5050Real = personTotalsUpToCurrent.reduce(
            (sum, p) => sum + p.split5050Paid * 0.5,
            0,
        );
        const householdReal = personTotalsUpToCurrent.reduce(
            (sum, p) => sum + p.householdPaid * p.sharePercent,
            0,
        );
        const revenue = income + credit;
        return {
            income,
            credit,
            revenue,
            total,
            debt,
            realSpending,
            split5050Paid,
            householdPaid,
            paidForPartner,
            personal,
            settlement,
            split5050Real,
            householdReal,
        };
    });

    // Aggregated category totals for this person
    const aggregatedCategoryTotals = $derived.by(() => {
        const totals: Record<string, number> = {};
        for (const month of personTotalsUpToCurrent) {
            for (const [category, amount] of Object.entries(
                month.categoryTotals,
            )) {
                totals[category] = (totals[category] || 0) + amount;
            }
        }
        return totals;
    });

    // Category colors for charts - unique color for each category
    const categoryColors: Record<string, string> = {
        Mercado: "#b8bb26", // bright green
        Transporte: "#83a598", // bright blue
        Água: "#8ec07c", // bright aqua
        Luz: "#fabd2f", // bright yellow
        "Comida boa": "#d3869b", // bright purple
        Filho: "#d65d0e", // orange
        Entreterimento: "#fe8019", // bright orange
        Saúde: "#fb4934", // bright red
        Casa: "#458588", // blue
        Educação: "#689d6a", // aqua
        Subscription: "#b16286", // purple
    };

    // Categories for chart selection
    type CategoryKey =
        | "income"
        | "credit"
        | "revenue"
        | "total"
        | "realSpending"
        | "split5050Paid"
        | "householdPaid"
        | "paidForPartner"
        | "personal"
        | "settlement";

    const chartCategories: {
        key: CategoryKey;
        label: string;
        chartColor: string;
    }[] = [
        { key: "income", label: "Income", chartColor: "#b8bb26" },
        { key: "credit", label: "Credit", chartColor: "#83a598" },
        { key: "revenue", label: "Total Revenue", chartColor: "#689d6a" },
        { key: "total", label: "Total Paid", chartColor: "#928374" },
        { key: "realSpending", label: "Real Spending", chartColor: "#d79921" },
        { key: "split5050Paid", label: "50/50", chartColor: "#fabd2f" },
        { key: "householdPaid", label: "Household", chartColor: "#b16286" },
        {
            key: "paidForPartner",
            label: "Paid for Partner",
            chartColor: "#d3869b",
        },
        { key: "personal", label: "Personal", chartColor: "#928374" },
        { key: "settlement", label: "Settlement", chartColor: "#fb4934" },
    ];

    // Selected category for chart
    let selectedChartCategory = $state<CategoryKey | null>(null);

    // Selected expense category for category line chart
    let selectedExpenseCategory = $state<ExpenseCategory | null>(null);

    // Chart data for expense category evolution
    const categoryChartData = $derived.by(() => {
        if (!selectedExpenseCategory) {
            return { labels: [], data: [] };
        }
        const sorted = [...personTotalsUpToCurrent].sort((a, b) =>
            compareMonthKeys(a.monthKey, b.monthKey),
        );
        return {
            labels: sorted.map((m) => formatMonthYear(m.monthKey)),
            data: sorted.map(
                (m) => m.categoryTotals[selectedExpenseCategory!] || 0,
            ),
        };
    });

    // Get selected category info
    const selectedCategory = $derived(
        chartCategories.find((c) => c.key === selectedChartCategory),
    );

    // Chart data - months sorted oldest to newest
    const chartData = $derived.by(() => {
        if (!selectedChartCategory) {
            return { labels: [], data: [] };
        }
        const sorted = [...personTotalsUpToCurrent].sort((a, b) =>
            compareMonthKeys(a.monthKey, b.monthKey),
        );
        return {
            labels: sorted.map((m) => formatMonthYear(m.monthKey)),
            data: sorted.map((m) => {
                if (selectedChartCategory === "revenue") {
                    return m.income + m.credit;
                }
                return m[selectedChartCategory!];
            }),
        };
    });

    // Inner tab state
    let innerTab = $state<"monthly" | "alltime">("monthly");
</script>

<div class="space-y-6">
    <Card>
        <!-- Header -->
        <div class="flex items-center gap-4 mb-6">
            <Avatar name={owner} size="xl" color={ownerColor} />
            <div class="flex-1">
                <h2 class="text-xl font-semibold text-themed">
                    {owner}'s Summary
                </h2>
                <p class="text-sm text-themed-secondary">
                    Personal breakdown and debt calculation
                </p>
            </div>
            {#if aggregatedTotals.debt !== 0}
                <div class="text-right">
                    <p class="text-xs text-themed-tertiary mb-0.5">
                        Overall Balance
                    </p>
                    <p
                        class="text-lg font-semibold font-mono {aggregatedTotals.debt >
                        0
                            ? 'text-negative'
                            : 'text-positive'}"
                    >
                        {aggregatedTotals.debt > 0 ? "Owes" : "Owed"}
                        {formatBRL(Math.abs(aggregatedTotals.debt))}
                    </p>
                </div>
            {/if}
        </div>

        <!-- Segmented Control -->
        <div class="flex bg-themed-tertiary rounded-lg p-1 mb-6">
            <button
                type="button"
                onclick={() => (innerTab = "monthly")}
                class="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all {innerTab ===
                'monthly'
                    ? 'bg-themed shadow-sm text-themed'
                    : 'text-themed-secondary hover:text-themed'}"
            >
                Monthly
            </button>
            <button
                type="button"
                onclick={() => (innerTab = "alltime")}
                class="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all {innerTab ===
                'alltime'
                    ? 'bg-themed shadow-sm text-themed'
                    : 'text-themed-secondary hover:text-themed'}"
            >
                All Time
            </button>
        </div>

        <!-- Monthly Tab -->
        {#if innerTab === "monthly"}
            {#if allPersonTotals.length === 0}
                <div class="py-12 text-center">
                    <div
                        class="w-14 h-14 mx-auto mb-3 rounded-full bg-themed-tertiary flex items-center justify-center"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="w-6 h-6 text-themed-tertiary"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <h3 class="text-base font-semibold text-themed mb-1">
                        No transactions yet
                    </h3>
                    <p class="text-sm text-themed-secondary">
                        Add transactions to see {owner}'s summary
                    </p>
                </div>
            {:else}
                <!-- Month Selector Header -->
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-semibold text-themed">
                        Monthly Detail
                    </h3>
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
                    {@const isCurrentMonth =
                        compareMonthKeys(person.monthKey, currentMonthKey) ===
                        0}
                    {@const isFutureMonth =
                        compareMonthKeys(person.monthKey, currentMonthKey) > 0}

                    <!-- Month Info -->
                    <div class="flex items-center justify-between mb-6">
                        <div>
                            <p class="text-sm text-themed-secondary">
                                {formatDate(range.start)} - {formatDate(
                                    range.end,
                                )}
                            </p>
                        </div>
                        <div class="flex items-center gap-2">
                            <Badge variant="default"
                                >{formatPercent(person.sharePercent)} share</Badge
                            >
                            {#if isCurrentMonth}
                                <Badge variant="success">Current</Badge>
                            {:else if isFutureMonth}
                                <Badge variant="warning">Future</Badge>
                            {/if}
                        </div>
                    </div>

                    <!-- Summary Stats — max 4 per row -->
                    <div
                        class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6"
                    >
                        <div class="relative p-3 rounded-lg bg-positive/10">
                            {#if previousMonthData}
                                {@const pct = calcPctChange(
                                    person.income,
                                    previousMonthData.income,
                                )}
                                {#if pct !== null}
                                    <span
                                        class="absolute top-1.5 right-1.5 text-[10px] font-semibold px-1 py-0.5 rounded {pct >
                                        0
                                            ? 'text-red-400 bg-red-400/15'
                                            : pct < 0
                                              ? 'text-green-400 bg-green-400/15'
                                              : 'text-themed-tertiary bg-themed-tertiary/30'}"
                                    >
                                        {pct > 0 ? "+" : ""}{Math.round(pct)}%
                                    </span>
                                {/if}
                            {/if}
                            <p
                                class="text-xs font-medium text-themed-secondary mb-1"
                            >
                                Income
                            </p>
                            <p
                                class="text-base font-semibold font-mono text-positive"
                            >
                                {formatBRL(person.income)}
                            </p>
                        </div>
                        <div class="relative p-3 rounded-lg bg-info/10">
                            {#if previousMonthData}
                                {@const pct = calcPctChange(
                                    person.credit,
                                    previousMonthData.credit,
                                )}
                                {#if pct !== null}
                                    <span
                                        class="absolute top-1.5 right-1.5 text-[10px] font-semibold px-1 py-0.5 rounded {pct >
                                        0
                                            ? 'text-red-400 bg-red-400/15'
                                            : pct < 0
                                              ? 'text-green-400 bg-green-400/15'
                                              : 'text-themed-tertiary bg-themed-tertiary/30'}"
                                    >
                                        {pct > 0 ? "+" : ""}{Math.round(pct)}%
                                    </span>
                                {/if}
                            {/if}
                            <p
                                class="text-xs font-medium text-themed-secondary mb-1"
                            >
                                Credit
                            </p>
                            <p
                                class="text-base font-semibold font-mono text-info"
                            >
                                {formatBRL(person.credit)}
                            </p>
                        </div>
                        <div class="relative p-3 rounded-lg bg-primary/10">
                            {#if previousMonthData}
                                {@const pct = calcPctChange(
                                    person.income + person.credit,
                                    previousMonthData.income +
                                        previousMonthData.credit,
                                )}
                                {#if pct !== null}
                                    <span
                                        class="absolute top-1.5 right-1.5 text-[10px] font-semibold px-1 py-0.5 rounded {pct >
                                        0
                                            ? 'text-red-400 bg-red-400/15'
                                            : pct < 0
                                              ? 'text-green-400 bg-green-400/15'
                                              : 'text-themed-tertiary bg-themed-tertiary/30'}"
                                    >
                                        {pct > 0 ? "+" : ""}{Math.round(pct)}%
                                    </span>
                                {/if}
                            {/if}
                            <p
                                class="text-xs font-medium text-themed-secondary mb-1"
                            >
                                Total Revenue
                            </p>
                            <p
                                class="text-base font-semibold font-mono text-primary"
                            >
                                {formatBRL(person.income + person.credit)}
                            </p>
                        </div>
                        <div class="relative p-3 rounded-lg bg-themed-tertiary">
                            {#if previousMonthData}
                                {@const pct = calcPctChange(
                                    person.total,
                                    previousMonthData.total,
                                )}
                                {#if pct !== null}
                                    <span
                                        class="absolute top-1.5 right-1.5 text-[10px] font-semibold px-1 py-0.5 rounded {pct >
                                        0
                                            ? 'text-red-400 bg-red-400/15'
                                            : pct < 0
                                              ? 'text-green-400 bg-green-400/15'
                                              : 'text-themed-tertiary bg-themed-tertiary/30'}"
                                    >
                                        {pct > 0 ? "+" : ""}{Math.round(pct)}%
                                    </span>
                                {/if}
                            {/if}
                            <p
                                class="text-xs font-medium text-themed-secondary mb-1"
                            >
                                Total Paid
                            </p>
                            <p
                                class="text-base font-semibold font-mono text-themed"
                            >
                                {formatBRL(person.total)}
                            </p>
                        </div>
                        <div class="relative p-3 rounded-lg bg-warning/10">
                            {#if previousMonthData}
                                {@const pct = calcPctChange(
                                    person.realSpending,
                                    previousMonthData.realSpending,
                                )}
                                {#if pct !== null}
                                    <span
                                        class="absolute top-1.5 right-1.5 text-[10px] font-semibold px-1 py-0.5 rounded {pct >
                                        0
                                            ? 'text-red-400 bg-red-400/15'
                                            : pct < 0
                                              ? 'text-green-400 bg-green-400/15'
                                              : 'text-themed-tertiary bg-themed-tertiary/30'}"
                                    >
                                        {pct > 0 ? "+" : ""}{Math.round(pct)}%
                                    </span>
                                {/if}
                            {/if}
                            <p
                                class="text-xs font-medium text-themed-secondary mb-1"
                            >
                                Real Spending
                            </p>
                            <p
                                class="text-base font-semibold font-mono text-warning"
                            >
                                {formatBRL(person.realSpending)}
                            </p>
                        </div>
                        <div
                            class="p-3 rounded-lg {person.debt > 0
                                ? 'bg-negative/10'
                                : person.debt < 0
                                  ? 'bg-positive/10'
                                  : 'bg-themed-tertiary'}"
                        >
                            <p
                                class="text-xs font-medium text-themed-secondary mb-1"
                            >
                                Balance
                            </p>
                            <p
                                class="text-base font-semibold font-mono {person.debt >
                                0
                                    ? 'text-negative'
                                    : person.debt < 0
                                      ? 'text-positive'
                                      : 'text-themed'}"
                            >
                                {person.debt > 0
                                    ? "-"
                                    : person.debt < 0
                                      ? "+"
                                      : ""}{formatBRL(Math.abs(person.debt))}
                            </p>
                        </div>
                    </div>

                    <!-- Detailed Breakdown -->
                    <div class="space-y-4">
                        <h4
                            class="text-sm font-semibold text-themed-secondary uppercase tracking-wide"
                        >
                            Detailed Breakdown
                        </h4>

                        <div
                            class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
                        >
                            <!-- 50/50 Split -->
                            <div
                                class="relative p-3 rounded-lg border border-themed-light"
                            >
                                {#if previousMonthData}
                                    {@const pct = calcPctChange(
                                        person.split5050Paid,
                                        previousMonthData.split5050Paid,
                                    )}
                                    {#if pct !== null}
                                        <span
                                            class="absolute top-1.5 right-1.5 text-[10px] font-semibold px-1 py-0.5 rounded {pct >
                                            0
                                                ? 'text-red-400 bg-red-400/15'
                                                : pct < 0
                                                  ? 'text-green-400 bg-green-400/15'
                                                  : 'text-themed-tertiary bg-themed-tertiary/30'}"
                                        >
                                            {pct > 0 ? "+" : ""}{Math.round(
                                                pct,
                                            )}%
                                        </span>
                                    {/if}
                                {/if}
                                <div class="flex items-center gap-2 mb-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="w-4 h-4 text-warning"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="8" y1="12" x2="16" y2="12" />
                                    </svg>
                                    <p
                                        class="text-xs font-medium text-themed-secondary"
                                    >
                                        50/50
                                    </p>
                                </div>
                                <p
                                    class="text-sm font-semibold font-mono text-themed"
                                >
                                    {formatBRL(person.split5050Paid)}
                                </p>
                                <p class="text-xs text-themed-tertiary mt-1">
                                    Real: {formatBRL(
                                        person.split5050Paid * 0.5,
                                    )}
                                </p>
                            </div>

                            <!-- Household -->
                            <div
                                class="relative p-3 rounded-lg border border-themed-light"
                            >
                                {#if previousMonthData}
                                    {@const pct = calcPctChange(
                                        person.householdPaid,
                                        previousMonthData.householdPaid,
                                    )}
                                    {#if pct !== null}
                                        <span
                                            class="absolute top-1.5 right-1.5 text-[10px] font-semibold px-1 py-0.5 rounded {pct >
                                            0
                                                ? 'text-red-400 bg-red-400/15'
                                                : pct < 0
                                                  ? 'text-green-400 bg-green-400/15'
                                                  : 'text-themed-tertiary bg-themed-tertiary/30'}"
                                        >
                                            {pct > 0 ? "+" : ""}{Math.round(
                                                pct,
                                            )}%
                                        </span>
                                    {/if}
                                {/if}
                                <div class="flex items-center gap-2 mb-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="w-4 h-4 text-utilities"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                                        />
                                        <polyline
                                            points="9 22 9 12 15 12 15 22"
                                        />
                                    </svg>
                                    <p
                                        class="text-xs font-medium text-themed-secondary"
                                    >
                                        Household
                                    </p>
                                </div>
                                <p
                                    class="text-sm font-semibold font-mono text-themed"
                                >
                                    {formatBRL(person.householdPaid)}
                                </p>
                                <p class="text-xs text-themed-tertiary mt-1">
                                    Real: {formatBRL(
                                        person.householdPaid *
                                            person.sharePercent,
                                    )}
                                </p>
                            </div>

                            <!-- Paid for Partner -->
                            <div
                                class="relative p-3 rounded-lg border border-themed-light"
                            >
                                {#if previousMonthData}
                                    {@const pct = calcPctChange(
                                        person.paidForPartner,
                                        previousMonthData.paidForPartner,
                                    )}
                                    {#if pct !== null}
                                        <span
                                            class="absolute top-1.5 right-1.5 text-[10px] font-semibold px-1 py-0.5 rounded {pct >
                                            0
                                                ? 'text-red-400 bg-red-400/15'
                                                : pct < 0
                                                  ? 'text-green-400 bg-green-400/15'
                                                  : 'text-themed-tertiary bg-themed-tertiary/30'}"
                                        >
                                            {pct > 0 ? "+" : ""}{Math.round(
                                                pct,
                                            )}%
                                        </span>
                                    {/if}
                                {/if}
                                <div class="flex items-center gap-2 mb-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="w-4 h-4 text-maria"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                                        />
                                    </svg>
                                    <p
                                        class="text-xs font-medium text-themed-secondary"
                                    >
                                        Paid for {partnerName}
                                    </p>
                                </div>
                                <p
                                    class="text-sm font-semibold font-mono text-themed"
                                >
                                    {formatBRL(person.paidForPartner)}
                                </p>
                                <p class="text-xs text-themed-tertiary mt-1">
                                    Real: {formatBRL(0)}
                                </p>
                            </div>

                            <!-- Personal -->
                            <div
                                class="relative p-3 rounded-lg border border-themed-light"
                            >
                                {#if previousMonthData}
                                    {@const pct = calcPctChange(
                                        person.personal,
                                        previousMonthData.personal,
                                    )}
                                    {#if pct !== null}
                                        <span
                                            class="absolute top-1.5 right-1.5 text-[10px] font-semibold px-1 py-0.5 rounded {pct >
                                            0
                                                ? 'text-red-400 bg-red-400/15'
                                                : pct < 0
                                                  ? 'text-green-400 bg-green-400/15'
                                                  : 'text-themed-tertiary bg-themed-tertiary/30'}"
                                        >
                                            {pct > 0 ? "+" : ""}{Math.round(
                                                pct,
                                            )}%
                                        </span>
                                    {/if}
                                {/if}
                                <div class="flex items-center gap-2 mb-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="w-4 h-4 text-themed-secondary"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                                        />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    <p
                                        class="text-xs font-medium text-themed-secondary"
                                    >
                                        Personal
                                    </p>
                                </div>
                                <p
                                    class="text-sm font-semibold font-mono text-themed"
                                >
                                    {formatBRL(person.personal)}
                                </p>
                            </div>

                            <!-- Settlement -->
                            <div
                                class="relative p-3 rounded-lg border border-themed-light"
                            >
                                {#if previousMonthData}
                                    {@const pct = calcPctChange(
                                        person.settlement,
                                        previousMonthData.settlement,
                                    )}
                                    {#if pct !== null}
                                        <span
                                            class="absolute top-1.5 right-1.5 text-[10px] font-semibold px-1 py-0.5 rounded {pct >
                                            0
                                                ? 'text-red-400 bg-red-400/15'
                                                : pct < 0
                                                  ? 'text-green-400 bg-green-400/15'
                                                  : 'text-themed-tertiary bg-themed-tertiary/30'}"
                                        >
                                            {pct > 0 ? "+" : ""}{Math.round(
                                                pct,
                                            )}%
                                        </span>
                                    {/if}
                                {/if}
                                <div class="flex items-center gap-2 mb-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="w-4 h-4 text-rent"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <line x1="12" y1="1" x2="12" y2="23" />
                                        <path
                                            d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                                        />
                                    </svg>
                                    <p
                                        class="text-xs font-medium text-themed-secondary"
                                    >
                                        Settlement
                                    </p>
                                </div>
                                <p
                                    class="text-sm font-semibold font-mono text-rent"
                                >
                                    {formatBRL(person.settlement)}
                                </p>
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
                                color: categoryColors[category] || "#928374",
                            }))}
                        <div class="mt-6 space-y-4">
                            <h4
                                class="text-sm font-semibold text-themed-secondary uppercase tracking-wide"
                            >
                                By Expense Category
                            </h4>
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div class="grid grid-cols-2 gap-2">
                                    {#each EXPENSE_CATEGORIES as cat (cat)}
                                        {@const amount =
                                            person.categoryTotals[cat] || 0}
                                        {#if amount > 0}
                                            <div
                                                class="relative p-2 rounded-lg border border-themed-light flex items-center gap-2"
                                            >
                                                {#if previousMonthData}
                                                    {@const prevAmt =
                                                        previousMonthData
                                                            .categoryTotals[
                                                            cat
                                                        ] || 0}
                                                    {@const pct = calcPctChange(
                                                        amount,
                                                        prevAmt,
                                                    )}
                                                    {#if pct !== null}
                                                        <span
                                                            class="absolute top-1 right-1 text-[9px] font-semibold px-1 py-0.5 rounded {pct >
                                                            0
                                                                ? 'text-red-400 bg-red-400/15'
                                                                : pct < 0
                                                                  ? 'text-green-400 bg-green-400/15'
                                                                  : 'text-themed-tertiary bg-themed-tertiary/30'}"
                                                        >
                                                            {pct > 0
                                                                ? "+"
                                                                : ""}{Math.round(
                                                                pct,
                                                            )}%
                                                        </span>
                                                    {/if}
                                                {/if}
                                                <div
                                                    class="w-3 h-3 rounded-full flex-shrink-0"
                                                    style="background-color: {categoryColors[
                                                        cat
                                                    ]}"
                                                ></div>
                                                <div class="min-w-0">
                                                    <p
                                                        class="text-xs text-themed-secondary truncate"
                                                    >
                                                        {EXPENSE_CATEGORY_EMOJIS[
                                                            cat
                                                        ]}
                                                        {cat}
                                                    </p>
                                                    <p
                                                        class="text-sm font-semibold font-mono text-themed"
                                                    >
                                                        {formatBRL(amount)}
                                                    </p>
                                                </div>
                                            </div>
                                        {/if}
                                    {/each}
                                </div>
                                {#if pieData.length > 0}
                                    <div
                                        class="flex items-center justify-center"
                                    >
                                        <PieChart data={pieData} height={220} />
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <!-- Income Flow Sankey -->
                        {@const sankeyData =
                            transformPersonToSankeyData(person)}
                        {#if sankeyData.links.length > 0}
                            <div class="mt-6 pt-6 border-t border-themed-light">
                                <h4
                                    class="text-sm font-semibold text-themed-secondary uppercase tracking-wide mb-4"
                                >
                                    Income Flow
                                </h4>
                                <SankeyChart data={sankeyData} height={300} />
                            </div>
                        {/if}
                    {/if}

                    <!-- Debt Result -->
                    <div
                        class="mt-6 p-4 rounded-xl {person.debt > 0
                            ? 'bg-negative/10 border border-negative/20'
                            : person.debt < 0
                              ? 'bg-positive/10 border border-positive/20'
                              : 'bg-themed-secondary'}"
                    >
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                {#if person.debt > 0}
                                    <div
                                        class="w-10 h-10 rounded-full bg-negative/20 flex items-center justify-center"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            class="w-5 h-5 text-negative"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                        >
                                            <line
                                                x1="12"
                                                y1="5"
                                                x2="12"
                                                y2="19"
                                            />
                                            <polyline
                                                points="19 12 12 19 5 12"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <p
                                            class="font-semibold text-sm text-negative"
                                        >
                                            {owner} owes {partnerName}
                                        </p>
                                        <p
                                            class="text-xs text-themed-secondary"
                                        >
                                            For this month
                                        </p>
                                    </div>
                                {:else if person.debt < 0}
                                    <div
                                        class="w-10 h-10 rounded-full bg-positive/20 flex items-center justify-center"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            class="w-5 h-5 text-positive"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                        >
                                            <line
                                                x1="12"
                                                y1="19"
                                                x2="12"
                                                y2="5"
                                            />
                                            <polyline
                                                points="5 12 12 5 19 12"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <p
                                            class="font-semibold text-sm text-positive"
                                        >
                                            {partnerName} owes {owner}
                                        </p>
                                        <p
                                            class="text-xs text-themed-secondary"
                                        >
                                            For this month
                                        </p>
                                    </div>
                                {:else}
                                    <div
                                        class="w-10 h-10 rounded-full bg-themed-tertiary flex items-center justify-center"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            class="w-5 h-5 text-primary"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                        >
                                            <path
                                                d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                                            />
                                            <polyline
                                                points="22 4 12 14.01 9 11.01"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <p
                                            class="font-semibold text-sm text-themed"
                                        >
                                            All settled!
                                        </p>
                                        <p
                                            class="text-xs text-themed-secondary"
                                        >
                                            For this month
                                        </p>
                                    </div>
                                {/if}
                            </div>
                            <p
                                class="text-xl font-semibold font-mono {person.debt >
                                0
                                    ? 'text-negative'
                                    : person.debt < 0
                                      ? 'text-positive'
                                      : 'text-themed'}"
                            >
                                {formatBRL(Math.abs(person.debt))}
                            </p>
                        </div>
                    </div>
                {/if}
            {/if}
        {/if}

        <!-- All Time Tab -->
        {#if innerTab === "alltime"}
            <!-- Aggregated Stats Grid (Clickable) — max 4 per row -->
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <button
                    type="button"
                    onclick={() =>
                        (selectedChartCategory =
                            selectedChartCategory === "income"
                                ? null
                                : "income")}
                    aria-pressed={selectedChartCategory === "income"}
                    class="p-3 rounded-lg bg-positive/10 text-left transition-[transform,box-shadow,ring] cursor-pointer {selectedChartCategory ===
                    'income'
                        ? 'scale-[1.02] shadow-md ring-2 ring-offset-2 ring-offset-themed ring-[#b8bb26]'
                        : 'hover:opacity-80'}"
                >
                    <p class="text-xs font-medium text-themed-secondary mb-1">
                        Total Income
                    </p>
                    <p class="text-base font-semibold font-mono text-positive">
                        {formatBRL(aggregatedTotals.income)}
                    </p>
                </button>
                <button
                    type="button"
                    onclick={() =>
                        (selectedChartCategory =
                            selectedChartCategory === "credit"
                                ? null
                                : "credit")}
                    aria-pressed={selectedChartCategory === "credit"}
                    class="p-3 rounded-lg bg-info/10 text-left transition-[transform,box-shadow,ring] cursor-pointer {selectedChartCategory ===
                    'credit'
                        ? 'scale-[1.02] shadow-md ring-2 ring-offset-2 ring-offset-themed ring-[#83a598]'
                        : 'hover:opacity-80'}"
                >
                    <p class="text-xs font-medium text-themed-secondary mb-1">
                        Total Credit
                    </p>
                    <p class="text-base font-semibold font-mono text-info">
                        {formatBRL(aggregatedTotals.credit)}
                    </p>
                </button>
                <button
                    type="button"
                    onclick={() =>
                        (selectedChartCategory =
                            selectedChartCategory === "revenue"
                                ? null
                                : "revenue")}
                    aria-pressed={selectedChartCategory === "revenue"}
                    class="p-3 rounded-lg bg-primary/10 text-left transition-[transform,box-shadow,ring] cursor-pointer {selectedChartCategory ===
                    'revenue'
                        ? 'scale-[1.02] shadow-md ring-2 ring-offset-2 ring-offset-themed ring-[#689d6a]'
                        : 'hover:opacity-80'}"
                >
                    <p class="text-xs font-medium text-themed-secondary mb-1">
                        Total Revenue
                    </p>
                    <p class="text-base font-semibold font-mono text-primary">
                        {formatBRL(aggregatedTotals.revenue)}
                    </p>
                </button>
                <button
                    type="button"
                    onclick={() =>
                        (selectedChartCategory =
                            selectedChartCategory === "total" ? null : "total")}
                    aria-pressed={selectedChartCategory === "total"}
                    class="p-3 rounded-lg bg-themed-tertiary text-left transition-[transform,box-shadow,ring] cursor-pointer {selectedChartCategory ===
                    'total'
                        ? 'scale-[1.02] shadow-md ring-2 ring-offset-2 ring-offset-themed ring-[#928374]'
                        : 'hover:opacity-80'}"
                >
                    <p class="text-xs font-medium text-themed-secondary mb-1">
                        Total Paid
                    </p>
                    <p class="text-base font-semibold font-mono text-themed">
                        {formatBRL(aggregatedTotals.total)}
                    </p>
                </button>
                <button
                    type="button"
                    onclick={() =>
                        (selectedChartCategory =
                            selectedChartCategory === "realSpending"
                                ? null
                                : "realSpending")}
                    aria-pressed={selectedChartCategory === "realSpending"}
                    class="p-3 rounded-lg bg-warning/10 text-left transition-[transform,box-shadow,ring] cursor-pointer {selectedChartCategory ===
                    'realSpending'
                        ? 'scale-[1.02] shadow-md ring-2 ring-offset-2 ring-offset-themed ring-[#fabd2f]'
                        : 'hover:opacity-80'}"
                >
                    <p class="text-xs font-medium text-themed-secondary mb-1">
                        Real Spending
                    </p>
                    <p class="text-base font-semibold font-mono text-warning">
                        {formatBRL(aggregatedTotals.realSpending)}
                    </p>
                </button>
                <div
                    class="p-3 rounded-lg {aggregatedTotals.debt > 0
                        ? 'bg-negative/10'
                        : aggregatedTotals.debt < 0
                          ? 'bg-positive/10'
                          : 'bg-themed-tertiary'}"
                >
                    <p class="text-xs font-medium text-themed-secondary mb-1">
                        Balance
                    </p>
                    <p
                        class="text-base font-semibold font-mono {aggregatedTotals.debt >
                        0
                            ? 'text-negative'
                            : aggregatedTotals.debt < 0
                              ? 'text-positive'
                              : 'text-themed'}"
                    >
                        {aggregatedTotals.debt > 0
                            ? "-"
                            : aggregatedTotals.debt < 0
                              ? "+"
                              : ""}{formatBRL(Math.abs(aggregatedTotals.debt))}
                    </p>
                </div>
            </div>

            <!-- All-Time Expense Categories (Clickable) -->
            <div class="mt-6 pt-6 border-t border-themed-light">
                <h4
                    class="text-sm font-semibold text-themed-secondary uppercase tracking-wide mb-4"
                >
                    All-Time by Category
                </h4>
                <div
                    class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
                >
                    <button
                        type="button"
                        onclick={() =>
                            (selectedChartCategory =
                                selectedChartCategory === "split5050Paid"
                                    ? null
                                    : "split5050Paid")}
                        aria-pressed={selectedChartCategory === "split5050Paid"}
                        class="p-3 rounded-lg border border-themed-light text-left transition-[transform,box-shadow,ring] cursor-pointer {selectedChartCategory ===
                        'split5050Paid'
                            ? 'scale-[1.02] shadow-md ring-2 ring-offset-2 ring-offset-themed ring-[#fabd2f]'
                            : 'hover:opacity-80'}"
                    >
                        <div class="flex items-center gap-2 mb-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="w-4 h-4 text-warning"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="8" y1="12" x2="16" y2="12" />
                            </svg>
                            <p
                                class="text-xs font-medium text-themed-secondary"
                            >
                                50/50
                            </p>
                        </div>
                        <p class="text-sm font-semibold font-mono text-themed">
                            {formatBRL(aggregatedTotals.split5050Paid)}
                        </p>
                        <p class="text-xs text-themed-tertiary mt-1">
                            Real: {formatBRL(aggregatedTotals.split5050Real)}
                        </p>
                    </button>
                    <button
                        type="button"
                        onclick={() =>
                            (selectedChartCategory =
                                selectedChartCategory === "householdPaid"
                                    ? null
                                    : "householdPaid")}
                        aria-pressed={selectedChartCategory === "householdPaid"}
                        class="p-3 rounded-lg border border-themed-light text-left transition-[transform,box-shadow,ring] cursor-pointer {selectedChartCategory ===
                        'householdPaid'
                            ? 'scale-[1.02] shadow-md ring-2 ring-offset-2 ring-offset-themed ring-[#b16286]'
                            : 'hover:opacity-80'}"
                    >
                        <div class="flex items-center gap-2 mb-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="w-4 h-4 text-utilities"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <path
                                    d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                                />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                            <p
                                class="text-xs font-medium text-themed-secondary"
                            >
                                Household
                            </p>
                        </div>
                        <p class="text-sm font-semibold font-mono text-themed">
                            {formatBRL(aggregatedTotals.householdPaid)}
                        </p>
                        <p class="text-xs text-themed-tertiary mt-1">
                            Real: {formatBRL(aggregatedTotals.householdReal)}
                        </p>
                    </button>
                    <button
                        type="button"
                        onclick={() =>
                            (selectedChartCategory =
                                selectedChartCategory === "paidForPartner"
                                    ? null
                                    : "paidForPartner")}
                        aria-pressed={selectedChartCategory ===
                            "paidForPartner"}
                        class="p-3 rounded-lg border border-themed-light text-left transition-[transform,box-shadow,ring] cursor-pointer {selectedChartCategory ===
                        'paidForPartner'
                            ? 'scale-[1.02] shadow-md ring-2 ring-offset-2 ring-offset-themed ring-[#d3869b]'
                            : 'hover:opacity-80'}"
                    >
                        <div class="flex items-center gap-2 mb-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="w-4 h-4 text-maria"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <path
                                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                                />
                            </svg>
                            <p
                                class="text-xs font-medium text-themed-secondary"
                            >
                                Paid for {partnerName}
                            </p>
                        </div>
                        <p class="text-sm font-semibold font-mono text-themed">
                            {formatBRL(aggregatedTotals.paidForPartner)}
                        </p>
                        <p class="text-xs text-themed-tertiary mt-1">
                            Real: {formatBRL(0)}
                        </p>
                    </button>
                    <button
                        type="button"
                        onclick={() =>
                            (selectedChartCategory =
                                selectedChartCategory === "personal"
                                    ? null
                                    : "personal")}
                        aria-pressed={selectedChartCategory === "personal"}
                        class="p-3 rounded-lg border border-themed-light text-left transition-[transform,box-shadow,ring] cursor-pointer {selectedChartCategory ===
                        'personal'
                            ? 'scale-[1.02] shadow-md ring-2 ring-offset-2 ring-offset-themed ring-[#928374]'
                            : 'hover:opacity-80'}"
                    >
                        <div class="flex items-center gap-2 mb-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="w-4 h-4 text-themed-secondary"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <path
                                    d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                                />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <p
                                class="text-xs font-medium text-themed-secondary"
                            >
                                Personal
                            </p>
                        </div>
                        <p class="text-sm font-semibold font-mono text-themed">
                            {formatBRL(aggregatedTotals.personal)}
                        </p>
                    </button>
                    <button
                        type="button"
                        onclick={() =>
                            (selectedChartCategory =
                                selectedChartCategory === "settlement"
                                    ? null
                                    : "settlement")}
                        aria-pressed={selectedChartCategory === "settlement"}
                        class="p-3 rounded-lg border border-themed-light text-left transition-[transform,box-shadow,ring] cursor-pointer {selectedChartCategory ===
                        'settlement'
                            ? 'scale-[1.02] shadow-md ring-2 ring-offset-2 ring-offset-themed ring-[#fb4934]'
                            : 'hover:opacity-80'}"
                    >
                        <div class="flex items-center gap-2 mb-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="w-4 h-4 text-rent"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <line x1="12" y1="1" x2="12" y2="23" />
                                <path
                                    d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                                />
                            </svg>
                            <p
                                class="text-xs font-medium text-themed-secondary"
                            >
                                Settlement
                            </p>
                        </div>
                        <p class="text-sm font-semibold font-mono text-rent">
                            {formatBRL(aggregatedTotals.settlement)}
                        </p>
                    </button>
                </div>
            </div>

            <!-- By Expense Category (All Time) -->
            {#if Object.keys(aggregatedCategoryTotals).length > 0}
                {@const allTimePieData = Object.entries(
                    aggregatedCategoryTotals,
                )
                    .filter(([_, amount]) => amount > 0)
                    .map(([category, amount]) => ({
                        label: `${EXPENSE_CATEGORY_EMOJIS[category as ExpenseCategory]} ${category}`,
                        value: amount,
                        color: categoryColors[category] || "#928374",
                    }))}
                <div class="mt-6 pt-6 border-t border-themed-light">
                    <h4
                        class="text-sm font-semibold text-themed-secondary uppercase tracking-wide mb-4"
                    >
                        By Expense Category (All Time)
                    </h4>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div class="grid grid-cols-2 gap-2">
                            {#each EXPENSE_CATEGORIES as cat (cat)}
                                {@const amount =
                                    aggregatedCategoryTotals[cat] || 0}
                                {#if amount > 0}
                                    <button
                                        type="button"
                                        onclick={() =>
                                            (selectedExpenseCategory =
                                                selectedExpenseCategory === cat
                                                    ? null
                                                    : cat)}
                                        aria-pressed={selectedExpenseCategory ===
                                            cat}
                                        class="p-2 rounded-lg border border-themed-light flex items-center gap-2 text-left transition-[transform,box-shadow,ring] cursor-pointer {selectedExpenseCategory ===
                                        cat
                                            ? 'scale-[1.02] shadow-md ring-2 ring-offset-2 ring-offset-themed'
                                            : 'hover:opacity-80'}"
                                        style={selectedExpenseCategory === cat
                                            ? `--tw-ring-color: ${categoryColors[cat]}`
                                            : ""}
                                    >
                                        <div
                                            class="w-3 h-3 rounded-full flex-shrink-0"
                                            style="background-color: {categoryColors[
                                                cat
                                            ]}"
                                        ></div>
                                        <div class="min-w-0">
                                            <p
                                                class="text-xs text-themed-secondary truncate"
                                            >
                                                {EXPENSE_CATEGORY_EMOJIS[cat]}
                                                {cat}
                                            </p>
                                            <p
                                                class="text-sm font-semibold font-mono text-themed"
                                            >
                                                {formatBRL(amount)}
                                            </p>
                                        </div>
                                    </button>
                                {/if}
                            {/each}
                        </div>
                        {#if allTimePieData.length > 0}
                            <div class="flex items-center justify-center">
                                <PieChart data={allTimePieData} height={220} />
                            </div>
                        {/if}
                    </div>
                    {#if selectedExpenseCategory && categoryChartData.labels.length > 0}
                        <div class="mt-4">
                            <h4
                                class="text-sm font-semibold text-themed-secondary uppercase tracking-wide mb-4"
                            >
                                {EXPENSE_CATEGORY_EMOJIS[
                                    selectedExpenseCategory
                                ]}
                                {selectedExpenseCategory} Evolution
                            </h4>
                            <LineChart
                                labels={categoryChartData.labels}
                                data={categoryChartData.data}
                                label={selectedExpenseCategory}
                                color={categoryColors[
                                    selectedExpenseCategory
                                ] || "#928374"}
                                height={250}
                            />
                        </div>
                    {/if}
                </div>
            {/if}

            <!-- Chart -->
            {#if selectedCategory && chartData.labels.length > 0}
                <div class="mt-6 pt-6 border-t border-themed-light">
                    <h4
                        class="text-sm font-semibold text-themed-secondary uppercase tracking-wide mb-4"
                    >
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
        {/if}
    </Card>
</div>
