import type { CombinedMonthlyTotals, PersonMonthlyTotals } from "$lib/types";

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
    Mercado: "#b8bb26", // bright green
    Transporte: "#83a598", // bright blue
    Água: "#8ec07c", // bright aqua
    Luz: "#fabd2f", // bright yellow
    "Comida boa": "#d3869b", // bright purple
    Filho: "#d65d0e", // orange
    Entreterimento: "#fe8019", // bright orange
    Saúde: "#fb4934", // bright red
    Casa: "#458588", // blue
    Educação: "#689d6a", // aqua
    Subscription: "#b16286", // purple
};

export function transformToSankeyData(
    monthData: CombinedMonthlyTotals,
): SankeyData {
    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];

    // Single income source node
    nodes.push({
        id: "income",
        name: "Income",
        color: "#b8bb26",
    });

    // Add category nodes and links for categories with values > 0
    for (const [category, amount] of Object.entries(monthData.categoryTotals)) {
        if (amount > 0) {
            nodes.push({
                id: `cat-${category}`,
                name: category,
                color: categoryColors[category] || "#928374",
            });

            links.push({
                source: "income",
                target: `cat-${category}`,
                value: amount,
            });
        }
    }

    // Calculate uncategorized expenses (grandTotal minus categorized)
    const totalCategorized = Object.values(monthData.categoryTotals).reduce(
        (a, b) => a + b,
        0,
    );
    const uncategorized = monthData.grandTotal - totalCategorized;

    if (uncategorized > 0) {
        nodes.push({
            id: "uncategorized",
            name: "Other",
            color: "#928374",
        });
        links.push({
            source: "income",
            target: "uncategorized",
            value: uncategorized,
        });
    }

    // Sort links by value descending for better visual hierarchy
    links.sort((a, b) => b.value - a.value);

    return { nodes, links };
}

export function transformPersonToSankeyData(
    personData: PersonMonthlyTotals,
): SankeyData {
    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];

    // Single income source node
    nodes.push({
        id: "income",
        name: "Income",
        color: "#b8bb26",
    });

    // Add category nodes and links for categories with values > 0
    for (const [category, amount] of Object.entries(
        personData.categoryTotals,
    )) {
        if (amount > 0) {
            nodes.push({
                id: `cat-${category}`,
                name: category,
                color: categoryColors[category] || "#928374",
            });

            links.push({
                source: "income",
                target: `cat-${category}`,
                value: amount,
            });
        }
    }

    // Calculate uncategorized expenses (total minus categorized)
    const totalCategorized = Object.values(personData.categoryTotals).reduce(
        (a, b) => a + b,
        0,
    );
    const uncategorized = personData.total - totalCategorized;

    if (uncategorized > 0) {
        nodes.push({
            id: "uncategorized",
            name: "Other",
            color: "#928374",
        });
        links.push({
            source: "income",
            target: "uncategorized",
            value: uncategorized,
        });
    }

    // Sort links by value descending for better visual hierarchy
    links.sort((a, b) => b.value - a.value);

    return { nodes, links };
}
