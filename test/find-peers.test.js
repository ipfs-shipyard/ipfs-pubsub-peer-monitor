'use strict'

const assert = require('assert')
const Monitor = require('../src/ipfs-pubsub-peer-monitor')

const peers = ['A', 'B', 'C', 'D', 'E']
const topic = 'tests'

const mockPubsub = {
  peers: () => Promise.resolve(peers)
}

describe('finds peers', () => {
  it('finds peers', async () => {
    const m = new Monitor(mockPubsub, topic, { pollInterval: 100 })
    const newPeers = await m.getPeers()
    assert.deepEqual(newPeers, peers)
  })

  it('emits \'join\' event for each peer', async () => {
    const m = new Monitor(mockPubsub, topic, { pollInterval: 10 })
    await new Promise((resolve, reject) => {
      let count = 0
      m.on('join', () => {
        try {
          count ++
          assert.equal(count <= peers.length, true)
          if (count === peers.length) {
            resolve()
          }
        } catch (e) {
          reject(e)
        }
      })
    })
  })
})
