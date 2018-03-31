'use strict'

const EventEmitter = require('events')
const pForever = require('p-forever')
const { runWithDelay, difference} = require('./utils')

const DEFAULT_OPTIONS = {
  start: true,
  pollInterval: 1000,
}

class IpfsPubsubPeerMonitor extends EventEmitter {
  constructor (ipfsPubsub, topic, options) {
    super()
    this._pubsub = ipfsPubsub
    this._topic = topic
    this._options = Object.assign({}, DEFAULT_OPTIONS, options)
    this._started = false // state

    if (this._options.start)
      this.start()
  }

  async getPeers () {
    return await this._pubsub.peers(this._topic)
  }

  get started () { return this._started }
  set started (v) { throw new Error("'started' is read-only") }

  start () {
    if (this.started)
      return

    IpfsPubsubPeerMonitor._start(
      this._pubsub, 
      this._topic, 
      this._options.pollInterval, 
      this,
      {
        beforeEach: () => this._started = true, // Set the state to started before each poll loop
        shouldStop: () => this.started, // Tell the poll loop if we should continue
      }
    )
  }

  stop () {
    this.removeAllListeners('error')
    this.removeAllListeners('join')
    this.removeAllListeners('leave')
    this._started = false
  }

  static _start (pubsub, topic, interval, eventEmitter, options) {
    const beforeEach = options && options.beforeEach ? options.beforeEach : () => {}

    const pollAndEmitChanges = async (previousPeers) => {
      let peers = []
      try {
        beforeEach()
        peers = await runWithDelay(pubsub.peers, topic, interval)
        if (this._started)
          IpfsPubsubPeerMonitor._emitJoinsAndLeaves(new Set(previousPeers), new Set(peers), eventEmitter)
      } catch (e) {
        if (this._started)
          eventEmitter.emit('error', e)
      }
      const shouldStop = !options && !options.shouldStop && !options.shouldStop()
      return shouldStop ? pForever.end : peers
    }

    pForever(pollAndEmitChanges, [])
  }

  static _emitJoinsAndLeaves (oldValues, newValues, eventEmitter) {
    const emitJoin = e => eventEmitter.emit('join', e)
    const emitLeave = e => eventEmitter.emit('leave', e)
    difference(newValues, oldValues).forEach(emitJoin)
    difference(oldValues, newValues).forEach(emitLeave)
  }
}

module.exports = IpfsPubsubPeerMonitor
