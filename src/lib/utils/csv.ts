import type { Transaction, Owner, ExpenseType } from '$lib/types';
import { parseBRL, parseDateBR } from './format';

// Portuguese to English type mapping
const TYPE_MAP: Record<string, ExpenseType> = {
	'Renda': 'Income',
	'Despesa Familiar': 'Household',
	'Despesa 50/50': 'Split 50/50',
	'Despesa Pessoal': 'Personal',
	'Pagou para o outro': 'Paid for Partner',
	'Credito': 'Credit',
	'Quitacao': 'Settlement'
};

// English types (for direct mapping)
const ENGLISH_TYPES: ExpenseType[] = [
	'Income',
	'Household',
	'Split 50/50',
	'Personal',
	'Paid for Partner',
	'Credit',
	'Settlement'
];

const VALID_OWNERS: Owner[] = ['Lorenzo', 'Maria'];

/**
 * Parses a CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;

	for (const char of line) {
		if (char === '"') {
			inQuotes = !inQuotes;
		} else if (char === ',' && !inQuotes) {
			result.push(current.trim());
			current = '';
		} else {
			current += char;
		}
	}
	result.push(current.trim());

	return result;
}

/**
 * Maps Portuguese expense type to English
 */
function mapExpenseType(type: string): ExpenseType | null {
	// Check Portuguese mapping first
	if (TYPE_MAP[type]) {
		return TYPE_MAP[type];
	}
	// Check if it's already in English
	if (ENGLISH_TYPES.includes(type as ExpenseType)) {
		return type as ExpenseType;
	}
	return null;
}

/**
 * Generates a unique ID
 */
function generateId(): string {
	return crypto.randomUUID();
}

export interface ParseResult {
	transactions: Transaction[];
	errors: string[];
	skipped: number;
}

/**
 * Parses CSV content into transactions
 * Supports both Portuguese and English column names and values
 */
export function parseCSV(csvContent: string): ParseResult {
	const lines = csvContent.trim().split('\n');
	const errors: string[] = [];
	let skipped = 0;

	if (lines.length < 2) {
		return { transactions: [], errors: ['CSV file is empty or has no data rows'], skipped: 0 };
	}

	// Parse header - support both Portuguese and English
	const headerLine = lines[0];
	const headers = parseCSVLine(headerLine).map((h) => h.toLowerCase().trim());

	// Map column indices - support both languages
	const ownerIdx = headers.findIndex((h) => h === 'dono' || h === 'owner');
	const descIdx = headers.findIndex((h) => h === 'descricao' || h === 'description');
	const amountIdx = headers.findIndex((h) => h === 'valor' || h === 'amount');
	const typeIdx = headers.findIndex((h) => h === 'tipo' || h === 'type');
	const dateIdx = headers.findIndex((h) => h === 'data' || h === 'date');

	// Validate required columns
	if (ownerIdx === -1 || descIdx === -1 || amountIdx === -1 || typeIdx === -1 || dateIdx === -1) {
		return {
			transactions: [],
			errors: [
				`Missing required columns. Expected: Dono/Owner, Descricao/Description, Valor/Amount, Tipo/Type, Data/Date. Found: ${headers.join(', ')}`
			],
			skipped: 0
		};
	}

	const transactions: Transaction[] = [];

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) {
			skipped++;
			continue;
		}

		const values = parseCSVLine(line);

		const owner = values[ownerIdx]?.trim();
		const description = values[descIdx]?.trim();
		const amountStr = values[amountIdx]?.trim();
		const typeStr = values[typeIdx]?.trim();
		const dateStr = values[dateIdx]?.trim();

		// Validate owner
		if (!VALID_OWNERS.includes(owner as Owner)) {
			errors.push(`Row ${i + 1}: Invalid owner "${owner}". Expected Lorenzo or Maria.`);
			skipped++;
			continue;
		}

		// Validate type
		const expenseType = mapExpenseType(typeStr);
		if (!expenseType) {
			errors.push(`Row ${i + 1}: Invalid type "${typeStr}".`);
			skipped++;
			continue;
		}

		// Parse amount
		const amount = parseBRL(amountStr);
		if (amount === 0 && !amountStr.includes('0')) {
			errors.push(`Row ${i + 1}: Invalid amount "${amountStr}".`);
			skipped++;
			continue;
		}

		// Parse date
		const date = parseDateBR(dateStr);
		if (isNaN(date.getTime())) {
			errors.push(`Row ${i + 1}: Invalid date "${dateStr}".`);
			skipped++;
			continue;
		}

		transactions.push({
			id: generateId(),
			owner: owner as Owner,
			description,
			amount,
			type: expenseType,
			date
		});
	}

	return { transactions, errors, skipped };
}

/**
 * Exports transactions to CSV format
 */
export function exportToCSV(transactions: Transaction[]): string {
	const header = 'Owner,Description,Amount,Type,Date';
	const rows = transactions.map((tx) => {
		const date = `${tx.date.getDate()}/${tx.date.getMonth() + 1}/${tx.date.getFullYear().toString().slice(-2)}`;
		const amount = tx.amount.toFixed(2).replace('.', ',');
		return `${tx.owner},"${tx.description}",R$${amount},${tx.type},${date}`;
	});

	return [header, ...rows].join('\n');
}
