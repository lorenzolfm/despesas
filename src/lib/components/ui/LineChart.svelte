<script lang="ts">
	import { browser } from '$app/environment';
	import { Chart, registerables } from 'chart.js';

	// Register all Chart.js components
	if (browser) {
		Chart.register(...registerables);
	}

	interface Props {
		labels: string[];
		data: number[];
		label: string;
		color?: string;
		height?: number;
	}

	let { labels, data, label, color = '#6366f1', height = 200 }: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	// Get theme-aware colors
	function getThemeColors() {
		if (!browser) return { text: '#6b7280', grid: '#e5e7eb', bg: 'rgba(99, 102, 241, 0.1)' };

		const isDark = document.documentElement.classList.contains('dark');
		return {
			text: isDark ? '#9ca3af' : '#6b7280',
			grid: isDark ? '#374151' : '#e5e7eb',
			bg: color + '20'
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

		chart = new Chart(ctx, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						label,
						data,
						borderColor: color,
						backgroundColor: themeColors.bg,
						fill: true,
						tension: 0.3,
						pointRadius: 4,
						pointHoverRadius: 6,
						pointBackgroundColor: color,
						pointBorderColor: color,
						pointHoverBackgroundColor: color,
						pointHoverBorderColor: '#fff',
						pointBorderWidth: 2,
						pointHoverBorderWidth: 2
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					intersect: false,
					mode: 'index'
				},
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						backgroundColor: themeColors.text === '#9ca3af' ? '#1f2937' : '#fff',
						titleColor: themeColors.text === '#9ca3af' ? '#fff' : '#111827',
						bodyColor: themeColors.text === '#9ca3af' ? '#d1d5db' : '#374151',
						borderColor: themeColors.grid,
						borderWidth: 1,
						padding: 12,
						displayColors: false,
						callbacks: {
							label: (context) => {
								const value = context.parsed.y;
								return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
							}
						}
					}
				},
				scales: {
					x: {
						grid: {
							display: false
						},
						ticks: {
							color: themeColors.text,
							font: {
								size: 11
							}
						}
					},
					y: {
						grid: {
							color: themeColors.grid
						},
						ticks: {
							color: themeColors.text,
							font: {
								size: 11
							},
							callback: (value) => {
								if (typeof value === 'number') {
									if (value >= 1000) {
										return `R$ ${(value / 1000).toFixed(0)}k`;
									}
									return `R$ ${value}`;
								}
								return value;
							}
						}
					}
				}
			}
		});
	}

	// Create/update chart when data changes
	$effect(() => {
		// Track dependencies
		labels;
		data;
		label;
		color;

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
