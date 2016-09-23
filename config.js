module.exports = {
  scope: ['https://spreadsheets.google.com/feeds'],
  nameRange: 'A1:CI1',
  dateRange: 'D1:D1000',
  client_email: process.env.SHEETS_CLIENT_EMAIL,
  private_key: process.env.SHEETS_PRIVATE_KEY
}
