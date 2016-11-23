'use strict'
const async = require('async')
const Google = require('googleapis')
const sheets = Google.sheets('v4')
const defaults = require('./config')
const Joi = require('joi')

function readSpreadsheetData(spreadsheetId, client, callback) {
  let initFunctions = {
    meta: getSheetMeta,
    ranges: getNameAndDateColumns
  }

  async.series(initFunctions, (err, result) => {
    if (err) {
      return callback(err)
    }

    callback(err, {
      meta: result.meta,
      names: result.ranges.names,
      dates: result.ranges.dates
    })
  })

  function getSheetMeta(callback) {
    sheets.spreadsheets.get({spreadsheetId: spreadsheetId, auth: client}, (err, result) => {
      callback(err, result)
    })
  }

  function getNameAndDateColumns(callback) {
    let opts = {
      spreadsheetId: spreadsheetId,
      auth: client,
      majorDimension: 'COLUMNS',
      ranges: [defaults.dateRange, defaults.nameRange]
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
}

// name date hours notes
function setEmployeeDay(spreadsheetId, client, data, done) {
  validateSetData(spreadsheetId, client, data, (err) => {
    if (err) return done(err)

    readSpreadsheetData(spreadsheetId, client, (err, spreadSheetData) => {
      if (err) return done(err)

      if (!spreadSheetData.names[data.name]) {
        return done(data.name + ' was not found in timesheet')
      }

      let column = spreadSheetData.names[data.name]

      let row = null

      let date = `${(data.day < 10 ? `0` : ``) + data.day}/${(data.month < 10 ? `0` : ``) + data.month}/${data.year - 2000}`

      for (var i in spreadSheetData.dates) {
        if (spreadSheetData.dates[i] === date) {
          row = parseInt(i) + 1
          break
        }
      }

      if (!row) {
        return done('Date ' + date + ' not found')
      }

      let hoursCell = spreadSheetData.names[data.name].hours + row
      let notesCell = spreadSheetData.names[data.name].notes + row

      let params = {
        spreadsheetId: spreadsheetId,
        auth: client,
        range: hoursCell + ':' + notesCell,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[data.time, data.notes]]
        }
      }
      sheets.spreadsheets.values.update(params, (err) => {
        if (err) {
          return done(err)
        }
        return done(null, {
          date: date,
          time: data.time,
          notes: data.notes
        })
      })
    })
  })
}

function getEmployeeDay(opts, callback) {
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

function _columnName(i) {
  return (i >= 26 ? _columnName((i / 26 >> 0) - 1) : '') +
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i % 26 >> 0]
}

function validateSetData(spreadsheetId, client, data, done) {
  Joi.validate(spreadsheetId, Joi.string().required(), err => {
    if (err) return done(err)

    Joi.validate(client, Joi.object().required(), err => {
      if (err) return done(err)

      Joi.validate(data, Joi.object().keys({
        name: Joi.string().required(),
        project: Joi.string().required(),
        time: Joi.number().required(),
        notes: Joi.string().min(3).required(),
        unit: Joi.string().valid('hour', 'day').required(),
        type: Joi.string().required(),
        year: Joi.number().min(2015).required(),
        month: Joi.number().min(1).max(12).required(),
        day: Joi.number().min(1).max(31).required()
      }).required(), err => {
        if (err) return done(err)

        done()
      })
    })
  })
}

module.exports = {
  setEmployeeDay: setEmployeeDay,
  getEmployeeDay: getEmployeeDay
}
