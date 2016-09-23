'use strict'
const Code = require('code')
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const expect = Code.expect

const ProjectTimeSheet = require('../')
const testDocId = '1aIajHPtlAOWQrre3Ug6o-76ik01mNdMpdOOjLUdUp1M'

lab.experiment('ProjectTimeSheet Test Suite', { timeout: 5000 }, () => {
  let timesheet

  lab.before({ timeout: 10000 }, (done) => {
    new ProjectTimeSheet(testDocId, (err, sheet) => {
      if (err) {
        throw err
      }
      timesheet = sheet
      done()
    })
  })

  lab.test('timesheet contains metadata', (done) => {
    expect(timesheet).to.include('meta')
    done()
  });

  lab.test('timesheet has a dates property', (done) => {
    expect(timesheet).to.include('dates')
    expect(timesheet.dates).to.be.an.array()
    done()
  })

  lab.test('timesheet name column mappings are generated correctly', (done) => {
    expect(timesheet.names).to.include(['Alice', 'Bob', 'Eve'])
    expect(timesheet.names.Alice).to.equal({hours: 'F', notes: 'G'})
    expect(timesheet.names.Bob).to.equal({hours: 'H', notes: 'I'})
    expect(timesheet.names.Eve).to.equal({hours: 'J', notes: 'K'})
    done()
  })

  lab.test('getEmployeeDay correct', (done) => {
    let opts = {
      name: 'Alice',
      date: '01/02/16'
    }
    timesheet.getEmployeeDay(opts, (err, result) => {
      expect(err).to.be.null()
      expect(result).to.equal({hours: '8', notes: 'this is a note'})
      done()
    })
  })

  lab.test('getEmployeeDay returns error when no options are passed', (done) => {
    timesheet.getEmployeeDay((err, result) => {
      expect(err).to.be.an.error('No options supplied')
      done()
    })
  })

  lab.test('getEmployeeDay returns error when empty options are passed', (done) => {
    timesheet.getEmployeeDay({}, (err, result) => {
      expect(err).to.be.an.error('options not supplied - name and date are required')
      done()
    })
  })

  lab.test('getEmployeeDay returns error when name is not found', (done) => {
    timesheet.getEmployeeDay({name: 'John', date: '19/09/16'}, (err, result) => {
      expect(err).to.be.an.error('John was not found in timesheet')
      done()
    })
  })

  lab.test('getEmployeeDay returns error when date is not found', (done) => {
    timesheet.getEmployeeDay({name: 'Alice', date: '19/09/17'}, (err, result) => {
      expect(err).to.be.an.error('Date 19/09/17 not found')
      done()
    })
  })

  lab.test('setEmployeeDay correct', (done) => {
    let hours = Math.floor(Math.random() * 10) + 1
    let opts = {
      name: 'Alice',
      date: '07/02/16',
      hours: hours,
      notes: 'running tests'
    }
    timesheet.setEmployeeDay(opts, (err) => {
      expect(err).to.be.null()
      timesheet.getEmployeeDay(opts, (err, result) => {
        expect(err).to.be.null()
        expect(result).to.be.equal({hours: String(hours), notes: 'running tests'})
        done()
      })
    })
  })

  lab.test('setEmployeeDay works without notes option', (done) => {
    let hours = Math.floor(Math.random() * 10) + 1
    let opts = {
      name: 'Alice',
      date: '07/03/16',
      hours: hours
    }
    timesheet.setEmployeeDay(opts, (err) => {
      expect(err).to.be.null()
      timesheet.getEmployeeDay(opts, (err, result) => {
        expect(err).to.be.null()
        expect(result).to.be.equal({hours: String(hours), notes: undefined})
        done()
      })
    })
  })

  lab.test('setEmployeeDay returns error when no options are passed', (done) => {
    timesheet.setEmployeeDay((err, result) => {
      expect(err).to.be.an.error('No options supplied')
      done()
    })
  })

  lab.test('setEmployeeDay returns error when empty options are passed', (done) => {
    timesheet.setEmployeeDay({}, (err, result) => {
      expect(err).to.be.an.error('options not supplied - name and date are required')
      done()
    })
  })

  lab.test('setEmployeeDay returns error when name not found', (done) => {
    let hours = Math.floor(Math.random() * 10) + 1
    let opts = {
      name: 'John',
      date: '07/02/16',
      hours: hours,
      notes: 'running tests'
    }
    timesheet.setEmployeeDay(opts, (err) => {
      expect(err).to.be.equal(Error('John was not found in timesheet'))
      done()
    })
  })

  lab.test('setEmployeeDay returns error when date not found', (done) => {
    let hours = Math.floor(Math.random() * 10) + 1
    let opts = {
      name: 'Alice',
      date: '07/02/17',
      hours: hours,
      notes: 'running tests'
    }
    timesheet.setEmployeeDay(opts, (err) => {
      expect(err).to.be.equal(Error('Date 07/02/17 not found'))
      done()
    })
  })

});
