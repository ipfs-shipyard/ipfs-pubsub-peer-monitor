'use strict'

const diff = require('hyperdiff')
const EventEmitter = require('events')

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
    this._peers = []

    if (this._options.start)
      this.start()
  }

  start () {
    this._interval = setInterval(this._pollPeers.bind(this), this._options.pollInterval)
  }

  stop () {
    clearInterval(this._interval)
  }

  getPeers () {
    return this._peers.slice()
  }

  hasPeer (peer) {
    return this._peers.includes(peer)
  }

  _pollPeers () {
    this._pubsub.peers(this._topic, (err, peers) => {
      if (err) {
        this.emit('error', err)
        return // early
      }
      this._emitChanges(this._peers, peers)
      this._peers = peers
    })
  }

  _emitChanges (oldPeers, newPeers) {
    const differences = diff(oldPeers, newPeers)
    const emitJoin = (addedPeer) => this.emit('join', addedPeer)
    const emitLeave = (removedPeer) => this.emit('leave', removedPeer)
    differences.added.forEach(emitJoin)
    differences.removed.forEach(emitLeave)
  }
}

module.exports = IpfsPubsubPeerMonitor
