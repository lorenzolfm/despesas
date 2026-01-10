import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { google } from 'googleapis';
import { parseSheetData } from '$lib/utils/googleSheets';
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
			scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
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
