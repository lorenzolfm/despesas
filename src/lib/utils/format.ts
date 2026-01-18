import type { MonthKey } from '$lib/types';

/**
 * Formats a number as Brazilian Real currency
 * Example: 1234.56 -> "R$ 1.234,56"
 */
export function formatBRL(value: number): string {
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL'
	}).format(value);
}

/**
 * Parses BRL string to number
 * Handles both formats:
 * - US format: "R$3,950.00" (comma = thousands, period = decimal)
 * - BR format: "R$3.950,00" (period = thousands, comma = decimal)
 */
export function parseBRL(value: string): number {
	let cleaned = value.replace(/R\$\s*/g, '').trim();

	// Detect format by looking at the last separator
	// US format: period is near the end as decimal (e.g., "3,950.00")
	// BR format: comma is near the end as decimal (e.g., "3.950,00")
	const lastComma = cleaned.lastIndexOf(',');
	const lastPeriod = cleaned.lastIndexOf('.');

	if (lastComma > lastPeriod) {
		// BR format: comma is decimal separator (1.234,56 -> 1234.56)
		cleaned = cleaned.replace(/\./g, '').replace(',', '.');
	} else if (lastPeriod > lastComma) {
		// US format: period is decimal separator (3,950.00 -> 3950.00)
		cleaned = cleaned.replace(/,/g, '');
	}
	// If neither or equal position, just parse as-is

	return parseFloat(cleaned) || 0;
}

/**
 * Formats date as DD/MM/YYYY
 */
export function formatDate(date: Date): string {
	const day = date.getDate().toString().padStart(2, '0');
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const year = date.getFullYear();
	return `${day}/${month}/${year}`;
}

/**
 * Formats date as YYYY-MM-DD for input[type="date"]
 */
export function formatDateForInput(date: Date): string {
	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * Parses date string to Date, supporting multiple formats:
 * - DD/MM/YY or DD/MM/YYYY (Brazilian format with /)
 * - YYYY-MM-DD (ISO format with -)
 * - Google Sheets serial numbers
 * Returns Invalid Date if no format matches (so errors are properly caught)
 */
export function parseDateBR(dateStr: string): Date {
	const trimmed = dateStr.trim();

	// Try DD/MM/YY or DD/MM/YYYY format (with /)
	if (trimmed.includes('/')) {
		const parts = trimmed.split('/').map(Number);
		if (parts.length === 3 && parts.every((p) => !isNaN(p))) {
			const [day, month, year] = parts;
			const fullYear = year < 100 ? (year < 50 ? 2000 + year : 1900 + year) : year;
			return new Date(fullYear, month - 1, day);
		}
	}

	// Try YYYY-MM-DD format (ISO with -)
	if (trimmed.includes('-')) {
		const parts = trimmed.split('-').map(Number);
		if (parts.length === 3 && parts.every((p) => !isNaN(p))) {
			const [year, month, day] = parts;
			return new Date(year, month - 1, day);
		}
	}

	// Try parsing as serial number (Google Sheets stores dates as days since Dec 30, 1899)
	const serialNum = parseFloat(trimmed);
	if (!isNaN(serialNum) && serialNum > 1 && serialNum < 100000) {
		// Google Sheets epoch is December 30, 1899
		const sheetsEpoch = new Date(1899, 11, 30);
		const date = new Date(sheetsEpoch.getTime() + serialNum * 24 * 60 * 60 * 1000);
		if (!isNaN(date.getTime())) {
			return date;
		}
	}

	// Return Invalid Date if no format matches
	return new Date(NaN);
}

/**
 * Creates a MonthKey from a Date
 */
export function getMonthKey(date: Date): MonthKey {
	return {
		year: date.getFullYear(),
		month: date.getMonth()
	};
}

/**
 * Converts MonthKey to string for Map keys
 */
export function monthKeyToString(monthKey: MonthKey): string {
	return `${monthKey.year}-${monthKey.month}`;
}

/**
 * Parses string to MonthKey
 */
export function stringToMonthKey(str: string): MonthKey {
	const [year, month] = str.split('-').map(Number);
	return { year, month };
}

/**
 * Formats month for display
 * Example: { year: 2025, month: 0 } -> "January 2025"
 */
export function formatMonthYear(monthKey: MonthKey): string {
	const months = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];
	return `${months[monthKey.month]} ${monthKey.year}`;
}

/**
 * Gets start and end dates of a month
 */
export function getMonthRange(monthKey: MonthKey): { start: Date; end: Date } {
	const start = new Date(monthKey.year, monthKey.month, 1);
	const end = new Date(monthKey.year, monthKey.month + 1, 0);
	return { start, end };
}

/**
 * Formats percentage
 * Example: 0.5391 -> "53.91%"
 */
export function formatPercent(value: number): string {
	return `${(value * 100).toFixed(2)}%`;
}

/**
 * Alias for formatBRL for consistency
 */
export const formatCurrency = formatBRL;

/**
 * Formats date as relative string (Today, Yesterday, or date)
 */
export function formatRelativeDate(date: Date): string {
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);

	const isToday = date.toDateString() === today.toDateString();
	const isYesterday = date.toDateString() === yesterday.toDateString();

	if (isToday) return 'Today';
	if (isYesterday) return 'Yesterday';
	return formatDate(date);
}

/**
 * Groups transactions by date for timeline display
 */
export function groupTransactionsByDate<T extends { date: Date }>(
	transactions: T[]
): Map<string, T[]> {
	const groups = new Map<string, T[]>();

	for (const tx of transactions) {
		const key = tx.date.toDateString();
		if (!groups.has(key)) {
			groups.set(key, []);
		}
		groups.get(key)!.push(tx);
	}

	return groups;
}
