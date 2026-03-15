<script lang="ts">
    import type { ExpenseCategory, ExpenseType, Owner } from "$lib/types";
    import {
        EXPENSE_CATEGORIES,
        EXPENSE_CATEGORY_EMOJIS,
        EXPENSE_TYPES,
        EXPENSE_TYPE_EMOJIS,
        OWNERS,
    } from "$lib/types";
    import {
        Avatar,
        Button,
        Card,
        DatePicker,
        Input,
        Modal,
        Select,
    } from "$lib/components/ui";
    import { addMonths, formatBRL, formatDate } from "$lib/utils/format";
    import { page } from "$app/state";

    interface Props {
        onSuccess?: () => void;
    }

    let { onSuccess }: Props = $props();

    function getDefaultOwner(): Owner {
        const session = page.data.session;
        const name = session?.user?.name?.toLowerCase() ?? "";
        const email = session?.user?.email?.toLowerCase() ?? "";
        if (name.includes("maria") || email.includes("maria")) {
            return "Maria";
        }
        return "Lorenzo";
    }

    // Collapsible state
    let isExpanded = $state(false);

    let owner = $state<Owner>(getDefaultOwner());
    let description = $state("");
    let amount = $state("");
    let type = $state<ExpenseType>("Household");
    let category = $state<ExpenseCategory | "">("");
    let date = $state(new Date());
    let installments = $state(1);

    let error = $state("");
    let errorShake = $state(false);
    let successCount = $state(1);
    let isSubmitting = $state(false);
    let showConfirmModal = $state(false);

    // Toast state
    let showToast = $state(false);
    let toastMessage = $state("");
    let toastDismissing = $state(false);

    // Store validated form data for confirmation
    let confirmData = $state<{
        owner: Owner;
        description: string;
        amount: number;
        type: ExpenseType;
        date: Date;
        category?: ExpenseCategory;
        installments: number;
    } | null>(null);

    const showInstallmentPreview = $derived(installments > 1);

    const categoryOptions = [
        { value: "", label: "No category" },
        ...EXPENSE_CATEGORIES.map((c) => ({
            value: c,
            label: `${EXPENSE_CATEGORY_EMOJIS[c]} ${c}`,
        })),
    ];

    function showErrorWithShake(msg: string) {
        error = msg;
        errorShake = true;
        setTimeout(() => (errorShake = false), 500);
    }

    function dismissToast() {
        toastDismissing = true;
        setTimeout(() => {
            showToast = false;
            toastDismissing = false;
        }, 250);
    }

    function handleSubmit(e: Event) {
        e.preventDefault();
        error = "";

        // Validation
        if (!description.trim()) {
            showErrorWithShake("Description is required");
            return;
        }

        const parsedAmount = parseFloat(amount.replace(",", "."));
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            showErrorWithShake("Please enter a valid amount");
            return;
        }

        if (!date || isNaN(date.getTime())) {
            showErrorWithShake("Please enter a valid date");
            return;
        }

        const parsedInstallments = Math.floor(Number(installments) || 1);
        if (parsedInstallments < 1 || parsedInstallments > 48) {
            showErrorWithShake("Installments must be between 1 and 48");
            return;
        }

        // Store validated data and show confirmation modal
        confirmData = {
            owner,
            description: description.trim(),
            amount: parsedAmount,
            type,
            date,
            category: category || undefined,
            installments: parsedInstallments,
        };
        showConfirmModal = true;
    }

    async function handleConfirm() {
        if (!confirmData) {
            return;
        }

        isSubmitting = true;
        showConfirmModal = false;

        try {
            // Make API call to write to Google Sheets
            const response = await fetch("/api/transactions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...confirmData,
                    date: confirmData.date.toISOString(),
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to save transaction");
            }

            // Reset form
            description = "";
            amount = "";
            category = "";
            date = new Date();
            installments = 1;
            successCount = result.count || 1;
            confirmData = null;

            // Collapse form
            isExpanded = false;

            // Show toast
            toastMessage =
                successCount > 1
                    ? `${successCount} transactions added successfully!`
                    : "Transaction added successfully!";
            showToast = true;
            toastDismissing = false;

            // Auto-dismiss toast
            setTimeout(() => {
                dismissToast();
            }, 3000);

            // Refresh the transactions list from Google Sheets
            onSuccess?.();
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Failed to save transaction. Please try again.";
        } finally {
            isSubmitting = false;
        }
    }

    function handleCancelConfirm() {
        showConfirmModal = false;
        confirmData = null;
    }
</script>

<!-- Toast Notification -->
{#if showToast}
    <div
        class="fixed top-4 right-4 z-[60] {toastDismissing
            ? 'animate-toast-out'
            : 'animate-toast-in'}"
        aria-live="polite"
    >
        <div
            class="flex items-center gap-3 px-4 py-3 rounded-xl bg-themed shadow-themed-lg border border-positive/20"
        >
            <div
                class="w-8 h-8 rounded-full bg-positive/10 flex items-center justify-center flex-shrink-0"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4 text-positive"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            </div>
            <span class="text-sm font-medium text-themed">{toastMessage}</span>
            <button
                onclick={dismissToast}
                class="p-1 rounded-lg text-themed-tertiary hover:text-themed hover:bg-themed-tertiary transition-colors cursor-pointer"
                aria-label="Dismiss"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </div>
    </div>
{/if}

{#if !isExpanded}
    <!-- Collapsed: Show "Add Transaction" button -->
    <button
        type="button"
        onclick={() => {
            isExpanded = true;
            error = "";
        }}
        class="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-primary text-white font-semibold text-sm shadow-sm shadow-primary/20 hover:bg-primary-dark active:scale-[0.98] transition-all duration-200 cursor-pointer"
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Transaction
    </button>
{:else}
    <!-- Expanded: Show the form -->
    <div class="animate-slide-up">
        <Card>
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div
                        class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="w-4.5 h-4.5 text-primary"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    </div>
                    <div>
                        <h2 class="text-base font-semibold text-themed">
                            Add Transaction
                        </h2>
                        <p class="text-xs text-themed-secondary">
                            Record a new expense or income
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onclick={() => (isExpanded = false)}
                    class="p-1.5 rounded-lg text-themed-tertiary hover:text-themed hover:bg-themed-tertiary transition-colors cursor-pointer"
                    aria-label="Close form"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            {#if error}
                <div
                    class="mb-4 p-3 rounded-lg bg-negative/10 border border-negative/20 flex items-center gap-2 {errorShake
                        ? 'animate-shake'
                        : ''}"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-5 h-5 text-negative flex-shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span class="text-sm text-negative">{error}</span>
                </div>
            {/if}

            <form onsubmit={handleSubmit} class="space-y-4">
                <!-- 1. Owner Selection -->
                <fieldset>
                    <legend
                        class="block text-sm font-medium text-themed-secondary mb-2"
                        >Who paid?</legend
                    >
                    <div class="flex gap-2">
                        {#each OWNERS as o (o)}
                            <button
                                type="button"
                                onclick={() => (owner = o)}
                                disabled={isSubmitting}
                                class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer {owner ===
                                o
                                    ? o === 'Lorenzo'
                                        ? 'border-lorenzo bg-lorenzo text-white'
                                        : 'border-maria bg-maria text-white'
                                    : 'border-themed hover:border-themed-tertiary bg-themed text-themed'}"
                            >
                                <Avatar
                                    name={o}
                                    size="sm"
                                    color={owner === o
                                        ? "primary"
                                        : o === "Lorenzo"
                                          ? "lorenzo"
                                          : "maria"}
                                />
                                <span class="font-medium text-sm">{o}</span>
                            </button>
                        {/each}
                    </div>
                </fieldset>

                <!-- 2. Type — pill buttons -->
                <fieldset>
                    <legend
                        class="block text-sm font-medium text-themed-secondary mb-2"
                        >Type</legend
                    >
                    <div class="flex flex-wrap gap-2">
                        {#each EXPENSE_TYPES as t (t)}
                            <button
                                type="button"
                                onclick={() => (type = t)}
                                disabled={isSubmitting}
                                class="px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed {type ===
                                t
                                    ? 'bg-primary text-white border-primary'
                                    : 'border-themed bg-themed text-themed hover:border-primary/40'}"
                            >
                                {EXPENSE_TYPE_EMOJIS[t]}
                                {t}
                            </button>
                        {/each}
                    </div>
                </fieldset>

                <!-- 3. Description — full width -->
                <Input
                    type="text"
                    label="Description"
                    bind:value={description}
                    placeholder="What was this expense for…"
                    required
                />

                <!-- 4. Amount / Date / Installments — compact row -->
                <div
                    class="grid grid-cols-[1fr_4rem] sm:grid-cols-[1fr_auto_5rem] gap-3"
                >
                    <Input
                        type="text"
                        label="Amount (R$)"
                        bind:value={amount}
                        placeholder="0.00…"
                        inputmode="decimal"
                        required
                    />

                    <div class="col-span-2 sm:col-span-1">
                        <DatePicker
                            label="Date"
                            bind:value={date}
                            disabled={isSubmitting}
                            required
                        />
                    </div>

                    <Input
                        type="number"
                        label="Installments"
                        bind:value={installments}
                        min="1"
                        max="48"
                        placeholder="1"
                        inputmode="numeric"
                    />
                </div>

                <!-- 5. Category — dropdown -->
                <Select
                    label="Category"
                    bind:value={category}
                    options={categoryOptions}
                />

                <!-- 6. Installment preview -->
                {#if showInstallmentPreview}
                    <div
                        class="p-3 rounded-lg bg-primary/5 border border-primary/20"
                    >
                        <p class="text-sm text-themed-secondary">
                            Will create <span class="font-medium text-themed"
                                >{installments}</span
                            >
                            transactions from
                            <span class="font-medium text-themed"
                                >{formatDate(date)}</span
                            >
                            to
                            <span class="font-medium text-themed"
                                >{formatDate(
                                    addMonths(date, installments - 1),
                                )}</span
                            >
                        </p>
                    </div>
                {/if}

                <!-- 7. Submit button -->
                <div class="pt-1">
                    <Button type="submit" fullWidth disabled={isSubmitting}>
                        {#if isSubmitting}
                            <svg
                                class="animate-spin w-4 h-4"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    class="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    stroke-width="4"
                                ></circle>
                                <path
                                    class="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            Saving...
                        {:else}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Add Transaction
                        {/if}
                    </Button>
                </div>
            </form>
        </Card>
    </div>
{/if}

<!-- Confirmation Modal -->
<Modal
    bind:open={showConfirmModal}
    title="Confirm Transaction"
    onclose={handleCancelConfirm}
    onconfirm={handleConfirm}
    confirmText="Save to Spreadsheet"
    cancelText="Cancel"
    confirmVariant="success"
    confirmDisabled={isSubmitting}
>
    {#if confirmData}
        <div class="space-y-4">
            <p class="text-sm text-themed-secondary mb-4">
                Please review the transaction details before saving to the
                spreadsheet.
            </p>

            <div class="space-y-3">
                <!-- Owner -->
                <div
                    class="flex items-center justify-between py-2 border-b border-themed"
                >
                    <span class="text-sm font-medium text-themed-secondary"
                        >Owner</span
                    >
                    <div class="flex items-center gap-2">
                        <Avatar
                            name={confirmData.owner}
                            size="sm"
                            color={confirmData.owner === "Lorenzo"
                                ? "lorenzo"
                                : "maria"}
                        />
                        <span class="text-sm font-semibold text-themed"
                            >{confirmData.owner}</span
                        >
                    </div>
                </div>

                <!-- Type -->
                <div
                    class="flex items-center justify-between py-2 border-b border-themed"
                >
                    <span class="text-sm font-medium text-themed-secondary"
                        >Type</span
                    >
                    <span class="text-sm font-semibold text-themed"
                        >{EXPENSE_TYPE_EMOJIS[confirmData.type]}
                        {confirmData.type}</span
                    >
                </div>

                <!-- Amount -->
                <div
                    class="flex items-center justify-between py-2 border-b border-themed"
                >
                    <span class="text-sm font-medium text-themed-secondary"
                        >Amount</span
                    >
                    <span class="text-lg font-bold text-primary font-mono"
                        >{formatBRL(confirmData.amount)}</span
                    >
                </div>

                <!-- Description -->
                <div
                    class="flex items-center justify-between py-2 border-b border-themed"
                >
                    <span class="text-sm font-medium text-themed-secondary"
                        >Description</span
                    >
                    <span class="text-sm font-semibold text-themed text-right"
                        >{confirmData.description}</span
                    >
                </div>

                <!-- Category -->
                {#if confirmData.category}
                    <div
                        class="flex items-center justify-between py-2 border-b border-themed"
                    >
                        <span class="text-sm font-medium text-themed-secondary"
                            >Category</span
                        >
                        <span class="text-sm font-semibold text-themed"
                            >{EXPENSE_CATEGORY_EMOJIS[confirmData.category]}
                            {confirmData.category}</span
                        >
                    </div>
                {/if}

                <!-- Date -->
                <div
                    class="flex items-center justify-between py-2 border-b border-themed"
                >
                    <span class="text-sm font-medium text-themed-secondary"
                        >Date</span
                    >
                    <span class="text-sm font-semibold text-themed"
                        >{formatDate(confirmData.date)}</span
                    >
                </div>

                <!-- Installments -->
                {#if confirmData.installments > 1}
                    <div
                        class="flex flex-col gap-1 py-2 border-b border-themed"
                    >
                        <div class="flex items-center justify-between">
                            <span
                                class="text-sm font-medium text-themed-secondary"
                                >Installments</span
                            >
                            <span class="text-sm font-semibold text-themed"
                                >{confirmData.installments}x</span
                            >
                        </div>
                        <p class="text-xs text-themed-secondary mt-1">
                            From {formatDate(confirmData.date)} to {formatDate(
                                addMonths(
                                    confirmData.date,
                                    confirmData.installments - 1,
                                ),
                            )}
                        </p>
                    </div>
                {/if}
            </div>

            <!-- Total summary for installments -->
            {#if confirmData.installments > 1}
                <div
                    class="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20"
                >
                    <p class="text-sm text-themed-secondary">
                        This will create <span class="font-semibold text-themed"
                            >{confirmData.installments}</span
                        >
                        transactions, totaling
                        <span class="font-semibold text-primary"
                            >{formatBRL(
                                confirmData.amount * confirmData.installments,
                            )}</span
                        >
                    </p>
                </div>
            {/if}
        </div>
    {/if}
</Modal>
