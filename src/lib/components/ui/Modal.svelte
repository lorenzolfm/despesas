<script lang="ts">
    import type { Snippet } from "svelte";
    import Button from "./Button.svelte";

    interface Props {
        open: boolean;
        title?: string;
        onclose: () => void;
        onconfirm?: () => void;
        confirmText?: string;
        cancelText?: string;
        confirmVariant?: "primary" | "danger" | "success";
        confirmDisabled?: boolean;
        children: Snippet;
    }

    let {
        open = $bindable(false),
        title = "",
        onclose,
        onconfirm,
        confirmText = "Confirm",
        cancelText = "Cancel",
        confirmVariant = "primary",
        confirmDisabled = false,
        children,
    }: Props = $props();

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            onclose();
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            onclose();
        }
    }
</script>

<svelte:window onkeydown={open ? handleKeydown : undefined} />

{#if open}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in overscroll-contain"
        onclick={handleBackdropClick}
        onkeydown={handleKeydown}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        tabindex="-1"
    >
        <div
            class="bg-themed rounded-xl shadow-themed-lg border border-themed-light w-full max-w-md animate-scale-in"
            role="document"
        >
            {#if title}
                <div class="px-6 py-4 border-b border-themed">
                    <div class="flex items-center justify-between">
                        <h3
                            id="modal-title"
                            class="text-lg font-semibold text-themed"
                        >
                            {title}
                        </h3>
                        <button
                            onclick={onclose}
                            class="p-1.5 -mr-1.5 rounded-lg text-themed-tertiary hover:text-themed hover:bg-themed-tertiary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                            aria-label="Close"
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
                </div>
            {/if}

            <div class="px-6 py-4">
                {@render children()}
            </div>

            <div
                class="px-6 py-4 border-t border-themed flex justify-end gap-3"
            >
                <Button variant="secondary" onclick={onclose}>
                    {cancelText}
                </Button>
                {#if onconfirm}
                    <Button
                        variant={confirmVariant}
                        onclick={onconfirm}
                        disabled={confirmDisabled}
                    >
                        {confirmText}
                    </Button>
                {/if}
            </div>
        </div>
    </div>
{/if}
