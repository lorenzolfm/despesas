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
 * Parses Google Sheets data (2D array of values) into transactions
 * First row should be headers
 */
export function parseSheetData(rows: string[][]): ParseResult {
	const errors: string[] = [];
	let skipped = 0;

	if (rows.length < 2) {
		return { transactions: [], errors: ['Sheet is empty or has no data rows'], skipped: 0 };
	}

	// Parse header - support both Portuguese and English
	const headers = rows[0].map((h) => String(h).toLowerCase().trim());

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

	for (let i = 1; i < rows.length; i++) {
		const row = rows[i];

		// Skip empty rows
		if (!row || row.length === 0 || row.every(cell => !cell || String(cell).trim() === '')) {
			skipped++;
			continue;
		}

		const owner = String(row[ownerIdx] ?? '').trim();
		const description = String(row[descIdx] ?? '').trim();
		const amountStr = String(row[amountIdx] ?? '').trim();
		const typeStr = String(row[typeIdx] ?? '').trim();
		const dateStr = String(row[dateIdx] ?? '').trim();

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
