# Nearform Timesheet
A library used to fill in a person's hours on a nearForm project timesheet in Google Sheets

# Usage
First you must go to the Google [developer console](https://console.developers.google.com) and do the following:
- Create a new project
- Enable the sheets API on the Project
- Generate service account credentials (this downloads a JSON file)
- Share the timesheet with the client_email address inside the JSON file

```js
const spreadsheetId = 'YourSpreadSheetID'
const ProjectTimeSheet = require('nearform-timesheet')

let config = require('credentials.json')

new ProjectTimeSheet(spreadsheetId, config, (err, sheet) => {
  let opts = {
    name: 'Dara Hayes',
    date: '19/01/16'
  }

  sheet.getEmployeeDay(opts, console.log)
  // {hours: 8, notes: 'Wrote a new dope library'}

  opts = {
    name: 'Dara Hayes',
    date: '20/01/16',
    hours: 8,
    notes: 'Wrote some tests for new library'
  }
  sheet.setEmployeeDay(opts, console.log)
})
```
