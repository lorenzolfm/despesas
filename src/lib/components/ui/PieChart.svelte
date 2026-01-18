<script lang="ts">
	import { browser } from '$app/environment';
	import { Chart, registerables } from 'chart.js';

	// Register all Chart.js components
	if (browser) {
		Chart.register(...registerables);
	}

	interface DataItem {
		label: string;
		value: number;
		color: string;
	}

	interface Props {
		data: DataItem[];
		height?: number;
	}

	let { data, height = 250 }: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	// Get theme-aware colors
	function getThemeColors() {
		if (!browser) return { text: '#6b7280', border: '#e5e7eb' };

		const isDark = document.documentElement.classList.contains('dark');
		return {
			text: isDark ? '#d1d5db' : '#374151',
			border: isDark ? '#1f2937' : '#ffffff'
		};
	}

	function createChart() {
		if (!browser || !canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const themeColors = getThemeColors();

		// Destroy existing chart
		if (chart) {
			chart.destroy();
		}

		const labels = data.map((d) => d.label);
		const values = data.map((d) => d.value);
		const colors = data.map((d) => d.color);

		chart = new Chart(ctx, {
			type: 'doughnut',
			data: {
				labels,
				datasets: [
					{
						data: values,
						backgroundColor: colors,
						borderColor: themeColors.border,
						borderWidth: 2,
						hoverOffset: 8
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				cutout: '60%',
				plugins: {
					legend: {
						display: true,
						position: 'right',
						labels: {
							color: themeColors.text,
							padding: 12,
							usePointStyle: true,
							pointStyle: 'circle',
							font: {
								size: 12
							}
						}
					},
					tooltip: {
						backgroundColor: themeColors.text === '#d1d5db' ? '#1f2937' : '#fff',
						titleColor: themeColors.text === '#d1d5db' ? '#fff' : '#111827',
						bodyColor: themeColors.text === '#d1d5db' ? '#d1d5db' : '#374151',
						borderColor: themeColors.border,
						borderWidth: 1,
						padding: 12,
						callbacks: {
							label: (context) => {
								const value = context.parsed;
								const total = values.reduce((a, b) => a + b, 0);
								const percentage = ((value / total) * 100).toFixed(1);
								return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${percentage}%)`;
							}
						}
					}
				}
			}
		});
	}

	// Create/update chart when data changes
	$effect(() => {
		// Track dependency
		data;

		if (browser && canvas) {
			createChart();
		}
	});

	// Watch for theme changes
	$effect(() => {
		if (!browser) return;

		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.attributeName === 'class') {
					createChart();
				}
			});
		});

		observer.observe(document.documentElement, { attributes: true });

		return () => observer.disconnect();
	});

	// Cleanup on destroy
	$effect(() => {
		return () => {
			if (chart) {
				chart.destroy();
				chart = null;
			}
		};
	});
</script>

<div class="w-full" style="height: {height}px;">
	<canvas bind:this={canvas}></canvas>
</div>
