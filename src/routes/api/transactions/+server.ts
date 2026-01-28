import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { google } from 'googleapis';
import { parseSheetData, transactionToSheetRow } from '$lib/utils/googleSheets';
import { addMonths } from '$lib/utils/format';
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
			range: 'A:F' // Columns A through F (Owner, Description, Amount, Type, Date, Category)
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
		const { owner, description, amount, type, date, category, installments = 1 } = body;

		// Validate required fields (category is optional)
		if (!owner || !description || amount === undefined || !type || !date) {
			return json(
				{ error: 'Missing required fields: owner, description, amount, type, date' },
				{ status: 400 }
			);
		}

		// Validate installments
		if (!Number.isInteger(installments) || installments < 1 || installments > 48) {
			return json(
				{ error: 'Installments must be an integer between 1 and 48.' },
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

		// Generate transactions (one per installment)
		const transactions = [];
		for (let i = 0; i < installments; i++) {
			const txDate = addMonths(parsedDate, i);
			const txDescription =
				installments > 1 ? `${description.trim()} ${i + 1}/${installments}` : description.trim();

			transactions.push({
				owner,
				description: txDescription,
				amount,
				type,
				date: txDate,
				category: category || undefined
			});
		}

		// Convert all transactions to sheet rows
		const rows = transactions.map((tx) => transactionToSheetRow(tx));

		// Batch append all rows in a single API call
		await sheets.spreadsheets.values.append({
			spreadsheetId: GOOGLE_SHEETS_ID,
			range: 'A:F',
			valueInputOption: 'USER_ENTERED',
			insertDataOption: 'INSERT_ROWS',
			requestBody: {
				values: rows
			}
		});

		// Return success
		return json({
			success: true,
			count: transactions.length,
			transactions: transactions.map((tx) => ({
				...tx,
				id: crypto.randomUUID(),
				date: tx.date.toISOString()
			}))
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
		const { rowNumber, description } = body;

		// Validate required fields
		if (!rowNumber || !description) {
			return json(
				{ error: 'Missing required fields: rowNumber, description' },
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

		// Fetch the specific row to verify it exists and matches
		const response = await sheets.spreadsheets.values.get({
			spreadsheetId: GOOGLE_SHEETS_ID,
			range: `A${rowNumber}:E${rowNumber}`
		});

		const rows = response.data.values;
		if (!rows || rows.length === 0) {
			return json(
				{ error: 'Transaction not found at specified row.' },
				{ status: 404 }
			);
		}

		const row = rows[0];
		const rowDesc = row[1]; // Description is column B (index 1)

		// Sanity check: verify description matches
		if (rowDesc !== description) {
			return json(
				{ error: 'Transaction mismatch. The data may have changed. Please refresh and try again.' },
				{ status: 409 }
			);
		}

		// Get the sheet ID (first sheet)
		const spreadsheet = await sheets.spreadsheets.get({
			spreadsheetId: GOOGLE_SHEETS_ID
		});
		const sheetId = spreadsheet.data.sheets?.[0]?.properties?.sheetId ?? 0;

		// Delete the row (rowNumber is 1-indexed, API uses 0-indexed)
		await sheets.spreadsheets.batchUpdate({
			spreadsheetId: GOOGLE_SHEETS_ID,
			requestBody: {
				requests: [{
					deleteDimension: {
						range: {
							sheetId: sheetId,
							dimension: 'ROWS',
							startIndex: rowNumber - 1,
							endIndex: rowNumber
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

		// Parse request body - contains original (with rowNumber) and updated transaction
		const body = await request.json();
		const { original, updated } = body;

		// Validate required fields
		if (!original || !updated) {
			return json(
				{ error: 'Missing required fields: original and updated transaction data' },
				{ status: 400 }
			);
		}

		const { rowNumber, description: origDesc } = original;
		const { owner, description, amount, type, date, category } = updated;

		// Validate original fields (only need rowNumber and description for identification)
		if (!rowNumber || !origDesc) {
			return json(
				{ error: 'Missing required fields in original transaction: rowNumber, description' },
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

		// Fetch the specific row to verify it exists and matches
		const response = await sheets.spreadsheets.values.get({
			spreadsheetId: GOOGLE_SHEETS_ID,
			range: `A${rowNumber}:E${rowNumber}`
		});

		const rows = response.data.values;
		if (!rows || rows.length === 0) {
			return json(
				{ error: 'Transaction not found at specified row.' },
				{ status: 404 }
			);
		}

		const row = rows[0];
		const rowDesc = row[1]; // Description is column B (index 1)

		// Sanity check: verify description matches
		if (rowDesc !== origDesc) {
			return json(
				{ error: 'Transaction mismatch. The data may have changed. Please refresh and try again.' },
				{ status: 409 }
			);
		}

		// Prepare the updated row data
		const transaction = {
			owner,
			description,
			amount,
			type,
			date: parsedDate,
			category: category || undefined
		};
		const rowData = transactionToSheetRow(transaction);

		// Update the row using rowNumber directly (already 1-indexed)
		await sheets.spreadsheets.values.update({
			spreadsheetId: GOOGLE_SHEETS_ID,
			range: `A${rowNumber}:F${rowNumber}`,
			valueInputOption: 'USER_ENTERED',
			requestBody: {
				values: [rowData]
			}
		});

		return json({
			success: true,
			transaction: {
				...transaction,
				rowNumber,
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
