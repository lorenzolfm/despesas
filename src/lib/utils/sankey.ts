import type { CombinedMonthlyTotals } from '$lib/types';

export interface SankeyNode {
	id: string;
	name: string;
	color: string;
}

export interface SankeyLink {
	source: string;
	target: string;
	value: number;
}

export interface SankeyData {
	nodes: SankeyNode[];
	links: SankeyLink[];
}

// Category colors - unique color for each category
const categoryColors: Record<string, string> = {
	'Mercado': '#10b981',        // emerald
	'Transporte': '#3b82f6',     // blue
	'Água': '#06b6d4',           // cyan
	'Luz': '#fbbf24',            // yellow
	'Comida boa': '#ec4899',     // pink
	'Filho': '#8b5cf6',          // violet
	'Entreterimento': '#f97316', // orange
	'Saúde': '#ef4444',          // red
	'Casa': '#6366f1',           // indigo
	'Educação': '#14b8a6',       // teal
	'Subscription': '#a855f7'    // purple
};

export function transformToSankeyData(monthData: CombinedMonthlyTotals): SankeyData {
	const nodes: SankeyNode[] = [];
	const links: SankeyLink[] = [];

	// Single income source node
	nodes.push({
		id: 'income',
		name: 'Income',
		color: '#22c55e'
	});

	// Add category nodes and links for categories with values > 0
	for (const [category, amount] of Object.entries(monthData.categoryTotals)) {
		if (amount > 0) {
			nodes.push({
				id: `cat-${category}`,
				name: category,
				color: categoryColors[category] || '#6b7280'
			});

			links.push({
				source: 'income',
				target: `cat-${category}`,
				value: amount
			});
		}
	}

	// Calculate uncategorized expenses (grandTotal minus categorized)
	const totalCategorized = Object.values(monthData.categoryTotals).reduce((a, b) => a + b, 0);
	const uncategorized = monthData.grandTotal - totalCategorized;

	if (uncategorized > 0) {
		nodes.push({
			id: 'uncategorized',
			name: 'Other',
			color: '#9ca3af'
		});
		links.push({
			source: 'income',
			target: 'uncategorized',
			value: uncategorized
		});
	}

	// Sort links by value descending for better visual hierarchy
	links.sort((a, b) => b.value - a.value);

	return { nodes, links };
}
