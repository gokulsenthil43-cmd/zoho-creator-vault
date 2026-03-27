import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, title, subtitle, category, codeFlow, action, timestamp } = body;

    // Google Sheets Auth details from Environment Variables
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        // Using replace because sometimes newline characters get escaped in Vercel or local .env
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/spreadsheets",
      ],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Formatting exactly as the user requested for the 7 columns:
    // A: Snippet ID, B: Title, C: Subtitle, D: Category, E: Code Flow, F: Action, G: Date & Time
    const rowData = [
      id,
      title,
      subtitle || "-",
      category,
      codeFlow,
      action,
      timestamp,
    ];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A:G", // targeting Sheet1 from columns A to G
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowData],
      },
    });

    return NextResponse.json({ success: true, response: response.data });
  } catch (error) {
    console.error("Google Sheets Sync Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
