export type Owner = 'Lorenzo' | 'Maria';

export type ExpenseType =
	| 'Income'
	| 'Household'
	| 'Split 50/50'
	| 'Personal'
	| 'Paid for Partner'
	| 'Credit'
	| 'Settlement';

export const EXPENSE_TYPES: ExpenseType[] = [
	'Income',
	'Household',
	'Split 50/50',
	'Personal',
	'Paid for Partner',
	'Credit',
	'Settlement'
];

export type ExpenseCategory =
	| 'Mercado'
	| 'Transporte'
	| 'Água'
	| 'Luz'
	| 'Comida boa'
	| 'Filho'
	| 'Entreterimento'
	| 'Saúde'
	| 'Casa'
	| 'Educação'
	| 'Subscription'
	| 'Investimento';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
	'Mercado',
	'Transporte',
	'Água',
	'Luz',
	'Comida boa',
	'Filho',
	'Entreterimento',
	'Saúde',
	'Casa',
	'Educação',
	'Subscription',
	'Investimento'
];

// Emoji mappings for expense types
export const EXPENSE_TYPE_EMOJIS: Record<ExpenseType, string> = {
	'Income': '💰',
	'Household': '🏠',
	'Split 50/50': '🤝',
	'Personal': '👤',
	'Paid for Partner': '💝',
	'Credit': '💳',
	'Settlement': '⚖️'
};

// Emoji mappings for expense categories
export const EXPENSE_CATEGORY_EMOJIS: Record<ExpenseCategory, string> = {
	'Mercado': '🛒',
	'Transporte': '🚗',
	'Água': '💧',
	'Luz': '💡',
	'Comida boa': '🍽️',
	'Filho': '👶',
	'Entreterimento': '🎮',
	'Saúde': '❤️‍🩹',
	'Casa': '🏡',
	'Educação': '📚',
	'Subscription': '📱',
	'Investimento': '📈'
};

export const OWNERS: Owner[] = ['Lorenzo', 'Maria'];

export interface Transaction {
	id: string;
	rowNumber: number; // 1-indexed row in Google Sheets
	owner: Owner;
	description: string;
	amount: number;
	type: ExpenseType;
	date: Date;
	category?: ExpenseCategory; // Optional expense category
}

export interface MonthKey {
	year: number;
	month: number; // 0-11
}

export interface PersonMonthlyTotals {
	owner: Owner;
	monthKey: MonthKey;
	income: number;
	sharePercent: number;
	credit: number;
	split5050Paid: number;
	split5050Portion: number;
	paidForPartner: number;
	householdPaid: number;
	householdPortion: number;
	personal: number;
	settlement: number;
	total: number;
	debt: number; // Positive = owes partner, Negative = partner owes them
	realSpending: number; // What they actually spend after reimbursements
	categoryTotals: Record<string, number>; // Totals by expense category
}

export interface CombinedMonthlyTotals {
	monthKey: MonthKey;
	totalIncome: number;
	totalCredit: number;
	totalSplit5050: number;
	totalPaidForPartner: number;
	totalHousehold: number;
	totalPersonal: number;
	totalSettlement: number;
	grandTotal: number;
	categoryTotals: Record<string, number>; // Combined totals by expense category
	lorenzo: PersonMonthlyTotals;
	maria: PersonMonthlyTotals;
}
