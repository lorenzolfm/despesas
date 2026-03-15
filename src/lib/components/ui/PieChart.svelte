<script lang="ts">
    import { browser } from "$app/environment";
    import { Chart, registerables } from "chart.js";

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
        if (!browser) {
            return { text: "#928374", border: "#d5c4a1" };
        }

        const isDark = document.documentElement.classList.contains("dark");
        return {
            text: isDark ? "#bdae93" : "#504945",
            border: isDark ? "#282828" : "#fbf1c7",
        };
    }

    function createChart() {
        if (!browser || !canvas) {
            return;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) {
            return;
        }

        const themeColors = getThemeColors();

        // Destroy existing chart
        if (chart) {
            chart.destroy();
        }

        const labels = data.map((d) => d.label);
        const values = data.map((d) => d.value);
        const colors = data.map((d) => d.color);

        chart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels,
                datasets: [
                    {
                        data: values,
                        backgroundColor: colors,
                        borderColor: themeColors.border,
                        borderWidth: 2,
                        hoverOffset: 8,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "60%",
                plugins: {
                    legend: {
                        display: true,
                        position: "right",
                        labels: {
                            color: themeColors.text,
                            padding: 12,
                            usePointStyle: true,
                            pointStyle: "circle",
                            font: {
                                size: 12,
                            },
                        },
                    },
                    tooltip: {
                        backgroundColor:
                            themeColors.text === "#bdae93"
                                ? "#282828"
                                : "#fbf1c7",
                        titleColor:
                            themeColors.text === "#bdae93"
                                ? "#ebdbb2"
                                : "#3c3836",
                        bodyColor:
                            themeColors.text === "#bdae93"
                                ? "#bdae93"
                                : "#504945",
                        borderColor: themeColors.border,
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed;
                                const total = values.reduce((a, b) => a + b, 0);
                                const percentage = (
                                    (value / total) *
                                    100
                                ).toFixed(1);
                                return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${percentage}%)`;
                            },
                        },
                    },
                },
            },
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
        if (!browser) {
            return;
        }

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === "class") {
                    createChart();
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });

        return () => observer.disconnect();
    });

    // Cleanup on destroy
    $effect(() => () => {
        if (chart) {
            chart.destroy();
            chart = null;
        }
    });
</script>

<div class="w-full" style="height: {height}px;">
    <canvas bind:this={canvas}></canvas>
</div>
