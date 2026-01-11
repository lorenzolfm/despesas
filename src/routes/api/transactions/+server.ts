import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { google } from 'googleapis';
import { parseSheetData, transactionToSheetRow } from '$lib/utils/googleSheets';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async () => {
	try {
		const { GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY } = env;

		// Validate environment variables
		if (!GOOGLE_SHEETS_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
			return json(
				{ error: 'Google Sheets API not configured. Please set environment variables.' },
				{ status: 500 }
			);
		}

		// Create auth client with service account
		const auth = new google.auth.GoogleAuth({
			credentials: {
				client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
				private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
			},
			scopes: ['https://www.googleapis.com/auth/spreadsheets']
		});

		const sheets = google.sheets({ version: 'v4', auth });

		// Fetch all data from the first sheet
		const response = await sheets.spreadsheets.values.get({
			spreadsheetId: GOOGLE_SHEETS_ID,
			range: 'A:E' // Columns A through E (Owner, Description, Amount, Type, Date)
		});

		const rows = response.data.values;

		if (!rows || rows.length === 0) {
			return json({ transactions: [], errors: [], skipped: 0 });
		}

		// Parse the sheet data into transactions
		const result = parseSheetData(rows as string[][]);

		// Return transactions with dates serialized as ISO strings
		const serializedTransactions = result.transactions.map(tx => ({
			...tx,
			date: tx.date.toISOString()
		}));

		return json({
			transactions: serializedTransactions,
			errors: result.errors,
			skipped: result.skipped
		});
	} catch (error) {
		console.error('Error fetching from Google Sheets:', error);

		const message = error instanceof Error ? error.message : 'Unknown error';
		return json(
			{ error: `Failed to fetch data from Google Sheets: ${message}` },
			{ status: 500 }
		);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY } = env;

		// Validate environment variables
		if (!GOOGLE_SHEETS_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
			return json(
				{ error: 'Google Sheets API not configured. Please set environment variables.' },
				{ status: 500 }
			);
		}

		// Parse request body
		const body = await request.json();
		const { owner, description, amount, type, date } = body;

		// Validate required fields
		if (!owner || !description || amount === undefined || !type || !date) {
			return json(
				{ error: 'Missing required fields: owner, description, amount, type, date' },
				{ status: 400 }
			);
		}

		// Validate owner
		if (!['Lorenzo', 'Maria'].includes(owner)) {
			return json(
				{ error: `Invalid owner "${owner}". Must be Lorenzo or Maria.` },
				{ status: 400 }
			);
		}

		// Validate type
		const validTypes = ['Income', 'Household', 'Split 50/50', 'Personal', 'Paid for Partner', 'Credit', 'Settlement'];
		if (!validTypes.includes(type)) {
			return json(
				{ error: `Invalid type "${type}".` },
				{ status: 400 }
			);
		}

		// Validate amount
		if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
			return json(
				{ error: 'Amount must be a positive number.' },
				{ status: 400 }
			);
		}

		// Parse and validate date
		const parsedDate = new Date(date);
		if (isNaN(parsedDate.getTime())) {
			return json(
				{ error: 'Invalid date format.' },
				{ status: 400 }
			);
		}

		// Create auth client with service account
		const auth = new google.auth.GoogleAuth({
			credentials: {
				client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
				private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
			},
			scopes: ['https://www.googleapis.com/auth/spreadsheets']
		});

		const sheets = google.sheets({ version: 'v4', auth });

		// Prepare the row data
		const transaction = {
			owner,
			description,
			amount,
			type,
			date: parsedDate
		};
		const rowData = transactionToSheetRow(transaction);

		// Append the row to the sheet
		await sheets.spreadsheets.values.append({
			spreadsheetId: GOOGLE_SHEETS_ID,
			range: 'A:E',
			valueInputOption: 'USER_ENTERED',
			insertDataOption: 'INSERT_ROWS',
			requestBody: {
				values: [rowData]
			}
		});

		// Return success
		return json({
			success: true,
			transaction: {
				...transaction,
				id: crypto.randomUUID(),
				date: parsedDate.toISOString()
			}
		});

	} catch (error) {
		console.error('Error writing to Google Sheets:', error);

		const message = error instanceof Error ? error.message : 'Unknown error';
		return json(
			{ error: `Failed to write to Google Sheets: ${message}` },
			{ status: 500 }
		);
	}
};

export const DELETE: RequestHandler = async ({ request }) => {
	try {
		const { GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY } = env;

		// Validate environment variables
		if (!GOOGLE_SHEETS_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
			return json(
				{ error: 'Google Sheets API not configured. Please set environment variables.' },
				{ status: 500 }
			);
		}

		// Parse request body
		const body = await request.json();
		const { owner, description, amount, type, date } = body;

		// Validate required fields
		if (!owner || !description || amount === undefined || !type || !date) {
			return json(
				{ error: 'Missing required fields: owner, description, amount, type, date' },
				{ status: 400 }
			);
		}

		// Create auth client with service account
		const auth = new google.auth.GoogleAuth({
			credentials: {
				client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
				private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
			},
			scopes: ['https://www.googleapis.com/auth/spreadsheets']
		});

		const sheets = google.sheets({ version: 'v4', auth });

		// Fetch all data to find the row to delete
		const response = await sheets.spreadsheets.values.get({
			spreadsheetId: GOOGLE_SHEETS_ID,
			range: 'A:E'
		});

		const rows = response.data.values;
		if (!rows || rows.length < 2) {
			return json(
				{ error: 'No transactions found to delete.' },
				{ status: 404 }
			);
		}

		// Parse the transaction date for comparison
		const txDate = new Date(date);
		const txDay = txDate.getUTCDate();
		const txMonth = txDate.getUTCMonth() + 1;
		const txYear = txDate.getUTCFullYear();

		// Find the row index that matches (skip header row)
		let rowIndexToDelete = -1;
		for (let i = 1; i < rows.length; i++) {
			const row = rows[i];
			if (!row || row.length < 5) continue;

			const [rowOwner, rowDesc, rowAmount, rowType, rowDate] = row;

			// Check owner and description match
			if (rowOwner !== owner || rowDesc !== description) continue;

			// Check amount (parse the formatted amount)
			const parsedAmount = parseFloat(
				String(rowAmount)
					.replace(/R\$\s*/g, '')
					.replace(/\./g, '')
					.replace(',', '.')
			) || 0;
			if (Math.abs(parsedAmount - amount) > 0.01) continue;

			// Check date - parse various formats
			let dateMatch = false;
			const dateStr = String(rowDate);

			// Try YYYY-MM-DD format
			if (dateStr.includes('-')) {
				const [y, m, d] = dateStr.split('-').map(Number);
				dateMatch = d === txDay && m === txMonth && y === txYear;
			}
			// Try DD/MM/YY or DD/MM/YYYY format
			else if (dateStr.includes('/')) {
				const parts = dateStr.split('/').map(Number);
				if (parts.length === 3) {
					const [d, m, y] = parts;
					const fullYear = y < 100 ? (y < 50 ? 2000 + y : 1900 + y) : y;
					dateMatch = d === txDay && m === txMonth && fullYear === txYear;
				}
			}

			if (!dateMatch) continue;

			// Found a match
			rowIndexToDelete = i;
			break;
		}

		if (rowIndexToDelete === -1) {
			return json(
				{ error: 'Transaction not found in spreadsheet.' },
				{ status: 404 }
			);
		}

		// Get the sheet ID (first sheet)
		const spreadsheet = await sheets.spreadsheets.get({
			spreadsheetId: GOOGLE_SHEETS_ID
		});
		const sheetId = spreadsheet.data.sheets?.[0]?.properties?.sheetId ?? 0;

		// Delete the row
		await sheets.spreadsheets.batchUpdate({
			spreadsheetId: GOOGLE_SHEETS_ID,
			requestBody: {
				requests: [{
					deleteDimension: {
						range: {
							sheetId: sheetId,
							dimension: 'ROWS',
							startIndex: rowIndexToDelete,
							endIndex: rowIndexToDelete + 1
						}
					}
				}]
			}
		});

		return json({ success: true });

	} catch (error) {
		console.error('Error deleting from Google Sheets:', error);

		const message = error instanceof Error ? error.message : 'Unknown error';
		return json(
			{ error: `Failed to delete from Google Sheets: ${message}` },
			{ status: 500 }
		);
	}
};

export const PUT: RequestHandler = async ({ request }) => {
	try {
		const { GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY } = env;

		// Validate environment variables
		if (!GOOGLE_SHEETS_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
			return json(
				{ error: 'Google Sheets API not configured. Please set environment variables.' },
				{ status: 500 }
			);
		}

		// Parse request body - contains original and updated transaction
		const body = await request.json();
		const { original, updated } = body;

		// Validate required fields
		if (!original || !updated) {
			return json(
				{ error: 'Missing required fields: original and updated transaction data' },
				{ status: 400 }
			);
		}

		const { owner: origOwner, description: origDesc, amount: origAmount, type: origType, date: origDate } = original;
		const { owner, description, amount, type, date } = updated;

		// Validate original fields
		if (!origOwner || !origDesc || origAmount === undefined || !origType || !origDate) {
			return json(
				{ error: 'Missing required fields in original transaction' },
				{ status: 400 }
			);
		}

		// Validate updated fields
		if (!owner || !description || amount === undefined || !type || !date) {
			return json(
				{ error: 'Missing required fields in updated transaction' },
				{ status: 400 }
			);
		}

		// Validate owner
		if (!['Lorenzo', 'Maria'].includes(owner)) {
			return json(
				{ error: `Invalid owner "${owner}". Must be Lorenzo or Maria.` },
				{ status: 400 }
			);
		}

		// Validate type
		const validTypes = ['Income', 'Household', 'Split 50/50', 'Personal', 'Paid for Partner', 'Credit', 'Settlement'];
		if (!validTypes.includes(type)) {
			return json(
				{ error: `Invalid type "${type}".` },
				{ status: 400 }
			);
		}

		// Validate amount
		if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
			return json(
				{ error: 'Amount must be a positive number.' },
				{ status: 400 }
			);
		}

		// Parse and validate date
		const parsedDate = new Date(date);
		if (isNaN(parsedDate.getTime())) {
			return json(
				{ error: 'Invalid date format.' },
				{ status: 400 }
			);
		}

		// Create auth client with service account
		const auth = new google.auth.GoogleAuth({
			credentials: {
				client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
				private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
			},
			scopes: ['https://www.googleapis.com/auth/spreadsheets']
		});

		const sheets = google.sheets({ version: 'v4', auth });

		// Fetch all data to find the row to update
		const response = await sheets.spreadsheets.values.get({
			spreadsheetId: GOOGLE_SHEETS_ID,
			range: 'A:E'
		});

		const rows = response.data.values;
		if (!rows || rows.length < 2) {
			return json(
				{ error: 'No transactions found to update.' },
				{ status: 404 }
			);
		}

		// Parse the original transaction date for comparison
		const txDate = new Date(origDate);
		const txDay = txDate.getUTCDate();
		const txMonth = txDate.getUTCMonth() + 1;
		const txYear = txDate.getUTCFullYear();

		// Find the row index that matches (skip header row)
		let rowIndexToUpdate = -1;
		for (let i = 1; i < rows.length; i++) {
			const row = rows[i];
			if (!row || row.length < 5) continue;

			const [rowOwner, rowDesc, rowAmount, rowType, rowDate] = row;

			// Check owner and description match
			if (rowOwner !== origOwner || rowDesc !== origDesc) continue;

			// Check amount (parse the formatted amount)
			const parsedAmount = parseFloat(
				String(rowAmount)
					.replace(/R\$\s*/g, '')
					.replace(/\./g, '')
					.replace(',', '.')
			) || 0;
			if (Math.abs(parsedAmount - origAmount) > 0.01) continue;

			// Check date - parse various formats
			let dateMatch = false;
			const dateStr = String(rowDate);

			// Try YYYY-MM-DD format
			if (dateStr.includes('-')) {
				const [y, m, d] = dateStr.split('-').map(Number);
				dateMatch = d === txDay && m === txMonth && y === txYear;
			}
			// Try DD/MM/YY or DD/MM/YYYY format
			else if (dateStr.includes('/')) {
				const parts = dateStr.split('/').map(Number);
				if (parts.length === 3) {
					const [d, m, y] = parts;
					const fullYear = y < 100 ? (y < 50 ? 2000 + y : 1900 + y) : y;
					dateMatch = d === txDay && m === txMonth && fullYear === txYear;
				}
			}

			if (!dateMatch) continue;

			// Found a match
			rowIndexToUpdate = i;
			break;
		}

		if (rowIndexToUpdate === -1) {
			return json(
				{ error: 'Transaction not found in spreadsheet.' },
				{ status: 404 }
			);
		}

		// Prepare the updated row data
		const transaction = {
			owner,
			description,
			amount,
			type,
			date: parsedDate
		};
		const rowData = transactionToSheetRow(transaction);

		// Update the row (rowIndexToUpdate + 1 because Sheets is 1-indexed)
		await sheets.spreadsheets.values.update({
			spreadsheetId: GOOGLE_SHEETS_ID,
			range: `A${rowIndexToUpdate + 1}:E${rowIndexToUpdate + 1}`,
			valueInputOption: 'USER_ENTERED',
			requestBody: {
				values: [rowData]
			}
		});

		return json({
			success: true,
			transaction: {
				...transaction,
				date: parsedDate.toISOString()
			}
		});

	} catch (error) {
		console.error('Error updating Google Sheets:', error);

		const message = error instanceof Error ? error.message : 'Unknown error';
		return json(
			{ error: `Failed to update Google Sheets: ${message}` },
			{ status: 500 }
		);
	}
};
