<script lang="ts">
	import { browser } from '$app/environment';
	import * as d3 from 'd3';
	import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
	import type { SankeyData, SankeyNode, SankeyLink } from '$lib/utils/sankey';
	import { formatBRL } from '$lib/utils/format';

	interface Props {
		data: SankeyData;
		height?: number;
	}

	let { data, height = 300 }: Props = $props();

	let container: HTMLDivElement;
	let svg: SVGSVGElement;

	// Get theme-aware colors
	function getThemeColors() {
		if (!browser) return { text: '#6b7280', linkOpacity: 0.4 };

		const isDark = document.documentElement.classList.contains('dark');
		return {
			text: isDark ? '#d1d5db' : '#374151',
			linkOpacity: isDark ? 0.35 : 0.5
		};
	}

	function renderSankey() {
		if (!browser || !svg || !container || data.nodes.length === 0 || data.links.length === 0)
			return;

		const themeColors = getThemeColors();
		const width = container.clientWidth;
		const margin = { top: 10, right: 120, bottom: 10, left: 10 };
		const innerWidth = width - margin.left - margin.right;
		const innerHeight = height - margin.top - margin.bottom;

		// Clear previous content
		d3.select(svg).selectAll('*').remove();

		// Build node map for sankey
		const nodeMap = new Map(data.nodes.map((n) => [n.id, { ...n }]));

		// Create sankey layout
		const sankeyGenerator = sankey<SankeyNode, SankeyLink>()
			.nodeId((d) => d.id)
			.nodeWidth(16)
			.nodePadding(12)
			.extent([
				[margin.left, margin.top],
				[margin.left + innerWidth, margin.top + innerHeight]
			]);

		// Prepare data for sankey (need to clone to avoid mutation)
		const sankeyData = sankeyGenerator({
			nodes: data.nodes.map((d) => ({ ...d })),
			links: data.links.map((d) => ({ ...d }))
		});

		const svgSelection = d3.select(svg);

		// Create gradient definitions for links
		const defs = svgSelection.append('defs');

		sankeyData.links.forEach((link, i) => {
			const sourceNode = link.source as SankeyNode & { x1: number };
			const targetNode = link.target as SankeyNode & { x0: number };

			const gradient = defs
				.append('linearGradient')
				.attr('id', `gradient-${i}`)
				.attr('gradientUnits', 'userSpaceOnUse')
				.attr('x1', sourceNode.x1)
				.attr('x2', targetNode.x0);

			gradient.append('stop').attr('offset', '0%').attr('stop-color', sourceNode.color);

			gradient.append('stop').attr('offset', '100%').attr('stop-color', targetNode.color);
		});

		// Draw links
		svgSelection
			.append('g')
			.attr('fill', 'none')
			.selectAll('path')
			.data(sankeyData.links)
			.join('path')
			.attr('d', sankeyLinkHorizontal())
			.attr('stroke', (_, i) => `url(#gradient-${i})`)
			.attr('stroke-opacity', themeColors.linkOpacity)
			.attr('stroke-width', (d) => Math.max(1, d.width || 0))
			.on('mouseenter', function () {
				d3.select(this).attr('stroke-opacity', themeColors.linkOpacity + 0.3);
			})
			.on('mouseleave', function () {
				d3.select(this).attr('stroke-opacity', themeColors.linkOpacity);
			})
			.append('title')
			.text((d) => {
				const source = (d.source as SankeyNode).name;
				const target = (d.target as SankeyNode).name;
				return `${source} → ${target}\n${formatBRL(d.value)}`;
			});

		// Draw nodes
		svgSelection
			.append('g')
			.selectAll('rect')
			.data(sankeyData.nodes)
			.join('rect')
			.attr('x', (d) => d.x0 || 0)
			.attr('y', (d) => d.y0 || 0)
			.attr('width', (d) => (d.x1 || 0) - (d.x0 || 0))
			.attr('height', (d) => Math.max(1, (d.y1 || 0) - (d.y0 || 0)))
			.attr('fill', (d) => d.color)
			.attr('rx', 3)
			.append('title')
			.text((d) => `${d.name}\n${formatBRL(d.value || 0)}`);

		// Draw labels
		svgSelection
			.append('g')
			.selectAll('text')
			.data(sankeyData.nodes)
			.join('text')
			.attr('x', (d) => ((d.x0 || 0) < width / 2 ? (d.x1 || 0) + 8 : (d.x0 || 0) - 8))
			.attr('y', (d) => ((d.y0 || 0) + (d.y1 || 0)) / 2)
			.attr('dy', '0.35em')
			.attr('text-anchor', (d) => ((d.x0 || 0) < width / 2 ? 'start' : 'end'))
			.attr('fill', themeColors.text)
			.attr('font-size', '12px')
			.attr('font-weight', '500')
			.text((d) => d.name);

		// Draw values next to labels (for target nodes)
		svgSelection
			.append('g')
			.selectAll('text')
			.data(sankeyData.nodes.filter((d) => d.id !== 'income'))
			.join('text')
			.attr('x', (d) => ((d.x0 || 0) < width / 2 ? (d.x1 || 0) + 8 : (d.x0 || 0) - 8))
			.attr('y', (d) => ((d.y0 || 0) + (d.y1 || 0)) / 2 + 14)
			.attr('dy', '0.35em')
			.attr('text-anchor', (d) => ((d.x0 || 0) < width / 2 ? 'start' : 'end'))
			.attr('fill', themeColors.text)
			.attr('font-size', '10px')
			.attr('opacity', 0.7)
			.text((d) => formatBRL(d.value || 0));
	}

	// Render when data changes
	$effect(() => {
		// Track dependency
		data;

		if (browser && svg && container) {
			renderSankey();
		}
	});

	// Watch for theme changes
	$effect(() => {
		if (!browser) return;

		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.attributeName === 'class') {
					renderSankey();
				}
			});
		});

		observer.observe(document.documentElement, { attributes: true });

		return () => observer.disconnect();
	});

	// Handle resize
	$effect(() => {
		if (!browser || !container) return;

		const resizeObserver = new ResizeObserver(() => {
			renderSankey();
		});

		resizeObserver.observe(container);

		return () => resizeObserver.disconnect();
	});
</script>

<div bind:this={container} class="w-full" style="height: {height}px;">
	<svg bind:this={svg} width="100%" height="100%"></svg>
</div>
