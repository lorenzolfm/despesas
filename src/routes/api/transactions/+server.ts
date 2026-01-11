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
