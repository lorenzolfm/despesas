<script lang="ts">
  interface Props {
    name: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    color?: 'lorenzo' | 'maria' | 'primary';
  }

  let {
    name,
    size = 'md',
    color = 'primary'
  }: Props = $props();

  const initial = $derived(name.charAt(0).toUpperCase());

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-12 h-12 text-lg'
  };

  const colorClasses = {
    lorenzo: 'bg-lorenzo text-white',
    maria: 'bg-maria text-white',
    primary: 'bg-primary text-white'
  };
</script>

<div
  class="inline-flex items-center justify-center rounded-full font-semibold {sizeClasses[size]} {colorClasses[color]}"
  title={name}
>
  {initial}
</div>
