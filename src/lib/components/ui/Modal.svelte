<script lang="ts">
  import type { Snippet } from 'svelte';
  import Button from './Button.svelte';

  interface Props {
    open: boolean;
    title?: string;
    onclose: () => void;
    onconfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'primary' | 'danger' | 'success';
    confirmDisabled?: boolean;
    children: Snippet;
  }

  let {
    open = $bindable(false),
    title = '',
    onclose,
    onconfirm,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmVariant = 'primary',
    confirmDisabled = false,
    children
  }: Props = $props();

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onclose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onclose();
    }
  }
</script>

<svelte:window onkeydown={open ? handleKeydown : undefined} />

{#if open}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="alertdialog"
    aria-modal="true"
    aria-labelledby={title ? 'modal-title' : undefined}
    tabindex="-1"
  >
    <div
      class="bg-themed rounded-xl shadow-themed-lg border border-themed w-full max-w-md transform transition-all"
      role="document"
    >
      {#if title}
        <div class="px-6 py-4 border-b border-themed">
          <h3 id="modal-title" class="text-lg font-semibold text-themed">{title}</h3>
        </div>
      {/if}

      <div class="px-6 py-4">
        {@render children()}
      </div>

      <div class="px-6 py-4 border-t border-themed flex justify-end gap-3">
        <Button variant="secondary" onclick={onclose}>
          {cancelText}
        </Button>
        {#if onconfirm}
          <Button variant={confirmVariant} onclick={onconfirm} disabled={confirmDisabled}>
            {confirmText}
          </Button>
        {/if}
      </div>
    </div>
  </div>
{/if}
