import type {
	Transaction,
	Owner,
	MonthKey,
	PersonMonthlyTotals,
	CombinedMonthlyTotals
} from '$lib/types';
import { getMonthKey, monthKeyToString } from './format';

/**
 * Groups transactions by month
 */
export function groupByMonth(transactions: Transaction[]): Map<string, Transaction[]> {
	const groups = new Map<string, Transaction[]>();

	for (const tx of transactions) {
		const key = monthKeyToString(getMonthKey(tx.date));
		const existing = groups.get(key) || [];
		groups.set(key, [...existing, tx]);
	}

	return groups;
}

/**
 * Filters transactions by owner and type
 */
export function filterTransactions(
	transactions: Transaction[],
	owner?: Owner,
	type?: Transaction['type']
): Transaction[] {
	return transactions.filter((tx) => {
		if (owner && tx.owner !== owner) return false;
		if (type && tx.type !== type) return false;
		return true;
	});
}

/**
 * Sums transaction amounts
 */
export function sumTransactions(transactions: Transaction[]): number {
	return transactions.reduce((sum, tx) => sum + tx.amount, 0);
}

/**
 * Calculates income share for each person in a month
 */
export function calculateShares(monthTransactions: Transaction[]): { lorenzo: number; maria: number } {
	const lorenzoIncome = sumTransactions(filterTransactions(monthTransactions, 'Lorenzo', 'Income'));
	const mariaIncome = sumTransactions(filterTransactions(monthTransactions, 'Maria', 'Income'));
	const totalIncome = lorenzoIncome + mariaIncome;

	if (totalIncome === 0) {
		return { lorenzo: 0.5, maria: 0.5 };
	}

	return {
		lorenzo: lorenzoIncome / totalIncome,
		maria: mariaIncome / totalIncome
	};
}

/**
 * Calculates monthly totals for a single person
 */
export function calculatePersonMonthlyTotals(
	monthTransactions: Transaction[],
	owner: Owner,
	monthKey: MonthKey
): PersonMonthlyTotals {
	const partner: Owner = owner === 'Lorenzo' ? 'Maria' : 'Lorenzo';
	const shares = calculateShares(monthTransactions);
	const sharePercent = owner === 'Lorenzo' ? shares.lorenzo : shares.maria;

	// Get totals by type for this person
	const income = sumTransactions(filterTransactions(monthTransactions, owner, 'Income'));
	const credit = sumTransactions(filterTransactions(monthTransactions, owner, 'Credit'));
	const personal = sumTransactions(filterTransactions(monthTransactions, owner, 'Personal'));
	const settlement = sumTransactions(filterTransactions(monthTransactions, owner, 'Settlement'));

	// What this person paid for shared expenses
	const split5050Paid = sumTransactions(filterTransactions(monthTransactions, owner, 'Split 50/50'));
	const householdPaid = sumTransactions(filterTransactions(monthTransactions, owner, 'Household'));
	const paidForPartner = sumTransactions(filterTransactions(monthTransactions, owner, 'Paid for Partner'));

	// Total shared expenses (from both people)
	const totalSplit5050 = sumTransactions(filterTransactions(monthTransactions, undefined, 'Split 50/50'));
	const totalHousehold = sumTransactions(filterTransactions(monthTransactions, undefined, 'Household'));

	// What this person SHOULD pay
	const split5050Portion = totalSplit5050 * 0.5;
	const householdPortion = totalHousehold * sharePercent;

	// What partner paid for this person
	const partnerPaidForMe = sumTransactions(filterTransactions(monthTransactions, partner, 'Paid for Partner'));

	// Calculate debt
	// What I should pay = my portion of shared expenses + what partner paid for me
	const shouldPay = split5050Portion + householdPortion + partnerPaidForMe;
	// What I actually paid = my shared expense payments + what I paid for partner
	const actuallyPaid = split5050Paid + householdPaid + paidForPartner;
	// Debt = what I should pay - what I actually paid - what I've settled
	// Positive = I owe partner, Negative = partner owes me
	const debt = shouldPay - actuallyPaid - settlement;

	// Total expenses (all types except Income and Credit)
	const total = split5050Paid + householdPaid + paidForPartner + personal;

	return {
		owner,
		monthKey,
		income,
		sharePercent,
		credit,
		split5050Paid,
		split5050Portion,
		paidForPartner,
		householdPaid,
		householdPortion,
		personal,
		settlement,
		total,
		debt
	};
}

/**
 * Calculates combined monthly totals for both people
 */
export function calculateCombinedMonthlyTotals(
	monthTransactions: Transaction[],
	monthKey: MonthKey
): CombinedMonthlyTotals {
	const lorenzo = calculatePersonMonthlyTotals(monthTransactions, 'Lorenzo', monthKey);
	const maria = calculatePersonMonthlyTotals(monthTransactions, 'Maria', monthKey);

	const totalIncome = sumTransactions(filterTransactions(monthTransactions, undefined, 'Income'));
	const totalCredit = sumTransactions(filterTransactions(monthTransactions, undefined, 'Credit'));
	const totalSplit5050 = sumTransactions(filterTransactions(monthTransactions, undefined, 'Split 50/50'));
	const totalPaidForPartner = sumTransactions(filterTransactions(monthTransactions, undefined, 'Paid for Partner'));
	const totalHousehold = sumTransactions(filterTransactions(monthTransactions, undefined, 'Household'));
	const totalPersonal = sumTransactions(filterTransactions(monthTransactions, undefined, 'Personal'));
	const totalSettlement = sumTransactions(filterTransactions(monthTransactions, undefined, 'Settlement'));

	const grandTotal = totalSplit5050 + totalPaidForPartner + totalHousehold + totalPersonal;

	return {
		monthKey,
		totalIncome,
		totalCredit,
		totalSplit5050,
		totalPaidForPartner,
		totalHousehold,
		totalPersonal,
		totalSettlement,
		grandTotal,
		lorenzo,
		maria
	};
}

/**
 * Calculates all monthly totals from transactions
 */
export function calculateAllMonthlyTotals(transactions: Transaction[]): CombinedMonthlyTotals[] {
	const grouped = groupByMonth(transactions);
	const totals: CombinedMonthlyTotals[] = [];

	for (const [key, monthTx] of grouped) {
		const [year, month] = key.split('-').map(Number);
		const monthKey = { year, month };
		totals.push(calculateCombinedMonthlyTotals(monthTx, monthKey));
	}

	// Sort by date descending (newest first)
	return totals.sort((a, b) => {
		if (a.monthKey.year !== b.monthKey.year) {
			return b.monthKey.year - a.monthKey.year;
		}
		return b.monthKey.month - a.monthKey.month;
	});
}
