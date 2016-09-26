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

  if (!config.client_email || !config.private_key) {
    throw Error('Missing google sheets credentials\n' +
      'please set $SHEETS_CLIENT_EMAIL and $SHEETS_SECRET_KEY or\n' +
      'pass credentials via config.client_email and config.private_key')
  }

  let jwtClient = new Google.auth.JWT(config.client_email, null, config.private_key, config.scope, null)

  let initFunctions = {
    auth: jwtClient.authorize.bind(jwtClient),
    meta: getSheetMeta,
    ranges: getNameAndDateColumns
  }

  async.series(initFunctions, (err, result) => {
    if (err) { return callback(err) }
    this.meta = result.meta
    this.names = result.ranges.names
    this.dates = result.ranges.dates
    this.setEmployeeDay = setEmployeeDay
    this.getEmployeeDay = getEmployeeDay
    callback(err, this)
  })

  // name date hours notes
  function setEmployeeDay (opts, callback) {
    if (typeof opts === 'function') {
      callback = opts
      return callback(Error('No options supplied'))
    }
    if (opts.name && opts.date) {
      if (this.names[opts.name]) {
        let row = this.dates.indexOf(opts.date) + 1
        if (row >= 1) {
          let hoursCell = this.names[opts.name].hours + row
          let notesCell = this.names[opts.name].notes + row
          let params = {
            spreadsheetId: spreadsheetId,
            auth: jwtClient,
            range: hoursCell + ':' + notesCell,
            valueInputOption: 'USER_ENTERED',
            resource: {
              values: [[opts.hours, opts.notes]]
            }
          }
          sheets.spreadsheets.values.update(params, callback)
        }
        else {
          callback(Error('Date ' + opts.date + ' not found'))
        }
      }
      else {
        callback(Error(opts.name + ' was not found in timesheet'))
      }
    }
    else {
      callback(Error('options not supplied - name and date are required'))
    }
  }

  function getEmployeeDay (opts, callback) {
    if (typeof opts === 'function') {
      callback = opts
      return callback(Error('No options supplied'))
    }
    if (opts.name && opts.date) {
      if (this.names[opts.name]) {
        let row = this.dates.indexOf(opts.date) + 1
        if (row >= 1) {
          let hoursCell = this.names[opts.name].hours + row
          let notesCell = this.names[opts.name].notes + row
          let params = {
            spreadsheetId: spreadsheetId,
            auth: jwtClient,
            range: hoursCell + ':' + notesCell,
            majorDimension: 'ROWS'
          }
          sheets.spreadsheets.values.get(params, (err, result) => {
            callback(err, {
              hours: (result.values ? result.values[0][0] : null),
              notes: (result.values ? result.values[0][1] : null)
            })
          })
        }
        else {
          callback(Error('Date ' + opts.date + ' not found'))
        }
      }
      else {
        callback(Error(opts.name + ' was not found in timesheet'))
      }
    }
    else {
      callback(Error('options not supplied - name and date are required'))
    }
  }

  function getSheetMeta (callback) {
    sheets.spreadsheets.get({spreadsheetId: spreadsheetId, auth: jwtClient}, (err, result) => {
      callback(err, result)
    })
  }

  function getNameAndDateColumns (callback) {
    let opts = {
      spreadsheetId: spreadsheetId,
      auth: jwtClient,
      majorDimension: 'COLUMNS',
      ranges: [config.dateRange, config.nameRange]
    }
    sheets.spreadsheets.values.batchGet(opts, (err, result) => {
      if (err) {
        return callback(err)
      }
      let dates = result.valueRanges[0].values[0]

      let names = {}
      result.valueRanges[1].values.forEach((val, index) => {
        if (val.length === 1) {
          names[val[0]] = {
            hours: _columnName(index),
            notes: _columnName(index + 1)
          }
        }
      })
      callback(null, {names: names, dates: dates})
    })
  }
} // end of TimeSheet function

function _columnName (i) {
  return (i >= 26 ? _columnName((i / 26 >> 0) - 1) : '') +
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i % 26 >> 0]
}

exports.ProjectTimeSheet = ProjectTimeSheet
