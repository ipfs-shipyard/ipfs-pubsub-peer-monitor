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
    if (this._interval)
      this.stop()

    this._interval = setInterval(
      this._pollPeers.bind(this), 
      this._options.pollInterval
    )
  }

  stop () {
    clearInterval(this._interval)
    this._interval = null
  }

  async getPeers () {
    this._peers = await this._pubsub.peers(this._topic)
    return this._peers.slice()
  }

  hasPeer (peer) {
    return this._peers.includes(peer)
  }

  async _pollPeers () {
    try {
      const peers = await this._pubsub.peers(this._topic)
      this._emitChanges(this._peers, peers)
      this._peers = peers
    } catch (err) {
        this.emit('error', err)
    }
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
