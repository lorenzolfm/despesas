<script lang="ts">
    import { onMount } from "svelte";
    import { fly, fade } from "svelte/transition";
    import Header from "$lib/components/Header.svelte";
    import TabNav from "$lib/components/TabNav.svelte";
    import BalanceHero from "$lib/components/BalanceHero.svelte";
    import ExpenseForm from "$lib/components/ExpenseForm.svelte";
    import TransactionTable from "$lib/components/TransactionTable.svelte";
    import CombinedSummary from "$lib/components/CombinedSummary.svelte";
    import IndividualSummary from "$lib/components/IndividualSummary.svelte";
    import { Modal, Button } from "$lib/components/ui";
    import { useExpenses } from "$lib/stores/expenses.svelte";
    import type { Transaction } from "$lib/types";

    const expenses = useExpenses();

    type Tab = "transactions" | "summary" | "lorenzo" | "maria";
    let activeTab = $state<Tab>("transactions");
    let showClearModal = $state(false);

    // Loading states for Google Sheets data
    let isLoading = $state(true);
    let loadError = $state<string | null>(null);

    // Fetch data from Google Sheets on mount
    async function fetchTransactions() {
        isLoading = true;
        loadError = null;

        try {
            const response = await fetch("/api/transactions");
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch transactions");
            }

            if (data.transactions && data.transactions.length > 0) {
                // Convert date strings back to Date objects
                const transactions: Transaction[] = data.transactions.map(
                    (tx: Transaction & { date: string }) => ({
                        ...tx,
                        date: new Date(tx.date),
                    }),
                );
                expenses.replaceAllTransactions(transactions);
            }

            if (data.errors && data.errors.length > 0) {
                console.warn("Parse errors:", data.errors);
            }
        } catch (error) {
            loadError =
                error instanceof Error ? error.message : "Failed to load data";
            console.error("Error fetching transactions:", error);
        } finally {
            isLoading = false;
        }
    }

    onMount(() => {
        fetchTransactions();
    });

    function handleTabChange(tab: Tab) {
        activeTab = tab;
    }

    function handleClearData() {
        expenses.clearAllTransactions();
        showClearModal = false;
    }

    function handleRefresh() {
        fetchTransactions();
    }
</script>

<svelte:head>
    <title>Despesas - Expense Tracker</title>
</svelte:head>

<div class="min-h-screen bg-themed-secondary transition-theme">
    <!-- Header -->
    <Header
        transactionCount={expenses.transactions.length}
        {isLoading}
        onRefresh={handleRefresh}
    />

    <!-- Error Banner -->
    {#if loadError}
        <div class="bg-negative/10 border-b border-negative/20 px-4 py-3" aria-live="polite">
            <div
                class="max-w-7xl mx-auto flex items-center justify-between gap-4"
            >
                <p class="text-sm text-negative">{loadError}</p>
                <Button variant="ghost" onclick={handleRefresh}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M21 2v6h-6" />
                        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                        <path d="M3 22v-6h6" />
                        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                    </svg>
                    Retry
                </Button>
            </div>
        </div>
    {/if}

    <!-- Tab Navigation -->
    <TabNav {activeTab} onTabChange={handleTabChange} />

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {#if isLoading}
            <!-- Loading Skeleton -->
            <div class="space-y-4">
                <!-- Balance hero skeleton -->
                <div class="bg-themed rounded-xl border border-themed-light overflow-hidden">
                    <div class="h-1 skeleton"></div>
                    <div class="p-6 flex flex-col items-center gap-3">
                        <div class="w-14 h-14 rounded-full skeleton"></div>
                        <div class="h-5 w-40 skeleton"></div>
                        <div class="h-10 w-48 skeleton"></div>
                        <div class="h-3 w-56 skeleton"></div>
                    </div>
                </div>
                <!-- Form button skeleton -->
                <div class="h-12 skeleton rounded-xl"></div>
                <!-- Transaction list skeleton -->
                <div class="bg-themed rounded-xl border border-themed-light overflow-hidden">
                    <div class="p-4 border-b border-themed-light">
                        <div class="h-11 skeleton rounded-xl"></div>
                    </div>
                    {#each Array(4) as _}
                        <div class="px-4 py-3 flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full skeleton flex-shrink-0"></div>
                            <div class="flex-1 space-y-2">
                                <div class="h-4 w-3/4 skeleton"></div>
                                <div class="h-3 w-1/3 skeleton"></div>
                            </div>
                            <div class="h-4 w-20 skeleton"></div>
                        </div>
                    {/each}
                </div>
            </div>
        {:else}
            {#key activeTab}
                <div in:fade={{ duration: 150 }}>
                    {#if activeTab === "transactions"}
                        <div class="space-y-4 stagger-children">
                            <!-- Balance Hero -->
                            <BalanceHero monthlyTotals={expenses.monthlyTotals} />

                            <!-- Add Transaction Section -->
                            <ExpenseForm onSuccess={fetchTransactions} />

                            <!-- Transactions List -->
                            <TransactionTable
                                onDelete={fetchTransactions}
                                onUpdate={fetchTransactions}
                            />
                        </div>
                    {:else if activeTab === "summary"}
                        <div class="space-y-4 animate-fade-in">
                            <BalanceHero monthlyTotals={expenses.monthlyTotals} />
                            <CombinedSummary />
                        </div>
                    {:else if activeTab === "lorenzo"}
                        <div class="animate-fade-in">
                            <IndividualSummary owner="Lorenzo" />
                        </div>
                    {:else if activeTab === "maria"}
                        <div class="animate-fade-in">
                            <IndividualSummary owner="Maria" />
                        </div>
                    {/if}
                </div>
            {/key}
        {/if}
    </main>

    <!-- Footer -->
    <footer class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <p class="text-xs text-themed-tertiary">
            Despesas - Expense tracking for Lorenzo & Maria
        </p>
    </footer>
</div>
