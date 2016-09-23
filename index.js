'use strict'
const async = require('async')
const Google = require('googleapis')
const sheets = Google.sheets('v4')
const defaults = require('./config')

function ProjectTimeSheet (spreadsheetId, config, callback) {
  // check to see if config were provided
  if (typeof config === 'function') {
    callback = config
  }
  config = Object.assign({}, defaults, config)

  if (!config.clientEmail || !config.secretKey) {
    throw Error('Missing google sheets credentials\n' +
      'please set $SHEETS_CLIENT_EMAIL and $SHEETS_SECRET_KEY or\n' +
      'pass credentials via config.clientEmail and config.secretKey')
  }

  let jwtClient = new Google.auth.JWT(config.clientEmail, null, config.secretKey, config.scope, null)

  let initFunctions = {
    auth: jwtClient.authorize.bind(jwtClient),
    meta: getSheetMeta,
    names: getEmployeeColumns,
    dates: getDateColumn
  }

  async.series(initFunctions, (err, result) => {
    if (err) { return callback(err) }
    this.meta = result.meta
    this.names = result.names
    this.dates = result.dates
    this.setEmployeeDay = setEmployeeDay
    this.getEmployeeDay = getEmployeeDay
    callback(err, this)
  })

  function setEmployeeDay (name, date, hours, notes, callback) {
    if (this.names[name]) {
      let row = this.dates.indexOf(date) + 1
      if (row >= 1) {
        let hoursCell = this.names[name].hours + row
        let notesCell = this.names[name].notes + row
        let opts = {
          spreadsheetId: spreadsheetId,
          auth: jwtClient,
          range: hoursCell + ':' + notesCell,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [[hours, notes]]
          }
        }
        sheets.spreadsheets.values.update(opts, callback)
      }
      else {
        callback(Error('Date ' + date + ' not found'))
      }
    }
    else {
      callback(Error(name + ' was not found in timesheet'))
    }
  }

  function getEmployeeDay (name, date, callback) {
    if (this.names[name]) {
      let row = this.dates.indexOf(date) + 1
      if (row >= 1) {
        let hoursCell = this.names[name].hours + row
        let notesCell = this.names[name].notes + row
        let opts = {
          spreadsheetId: spreadsheetId,
          auth: jwtClient,
          range: hoursCell + ':' + notesCell,
          majorDimension: 'ROWS'
        }
        sheets.spreadsheets.values.get(opts, (err, result) => {
          callback(err, {
            hours: (result.values ? result.values[0][0] : null),
            notes: (result. values? result.values[0][1] : null)
          })
        })
      }
      else {
        callback(Error('Date ' + date + ' not found'))
      }
    }
    else {
      callback(Error(name + ' was not found in timesheet'))
    }
  }

  function getSheetMeta(callback) {
    sheets.spreadsheets.get({spreadsheetId: spreadsheetId, auth: jwtClient}, (err, result) => {
      callback(err, result)
    })
  }

  // Return key:value pairs in the format Name:Column e.g. 'Dara Hayes':'F'
  function getEmployeeColumns(callback) {
    sheets.spreadsheets.values.get({spreadsheetId: spreadsheetId, auth: jwtClient, range: config.nameRange}, (err, range) => {
      if (err) { return callback(err) }
      let names = {}
      range.values[0].forEach((val, index) => {
        if (val != '') {
          names[val] = {
            hours: _columnName(index),
            notes: _columnName(index+1)
          };
        }
      })
      callback(null, names)
    })
  }

  function getDateColumn (callback) {
    sheets.spreadsheets.values.get({spreadsheetId: spreadsheetId, auth: jwtClient, range: config.dateRange, majorDimension: 'COLUMNS'}, (err, range) => {
      callback(err, range.values[0])
    })
  }

} // end of TimeSheet function

function _columnName(i) {
  return (i >= 26 ? _columnName((i / 26 >> 0) - 1) : '') +
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i % 26 >> 0]
}

module.exports = ProjectTimeSheet
