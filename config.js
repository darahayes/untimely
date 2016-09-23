module.exports = {
  scope: ['https://spreadsheets.google.com/feeds'],
  nameRange: 'A1:CI1',
  dateRange: 'D1:D1000',
  clientEmail: process.env.SHEETS_CLIENT_EMAIL,
  secretKey: process.env.SHEETS_SECRET_KEY
}
