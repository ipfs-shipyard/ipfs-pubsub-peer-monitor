'use strict'

const assert = require('assert')
const Monitor = require('../src/ipfs-pubsub-peer-monitor')

const peers = ['A', 'B', 'C']
const topic = 'tests'

const mockPubsub = {
  peers: () => Promise.resolve(peers)
}

describe('start and stop', () => {
  describe('poll loop', () => {
    it('starts polling peers', () => {
      const m = new Monitor(mockPubsub, topic)
      assert.notEqual(m, null)
      assert.notEqual(m._interval, null)
    })

    it('doesn\'t start polling peers', () => {
      const m = new Monitor(mockPubsub, topic, { start: false })
      assert.notEqual(m, null)
      assert.equal(m._interval, null)
    })

    it('starts polling peers when started manually', () => {
      const m = new Monitor(mockPubsub, topic, { start: false })
      assert.equal(m._interval, null)
      m.start()
      assert.notEqual(m._interval, null)
    })

    it('starts a new interval when started manually', () => {
      const m = new Monitor(mockPubsub, topic, { start: false })
      assert.equal(m._interval, null)
      m.start()
      const previous = m._interval
      m.start()
      assert.notEqual(m._interval, previous)
    })

    it('stops polling peers', () => {
      const m = new Monitor(mockPubsub, topic)
      m.stop()
      assert.equal(m._interval, null)
    })

    it('polls with the given interval', async () => {
      const interval = 100
      const margin = interval / 10

      const m = new Monitor(mockPubsub, topic, { pollInterval: interval })
      const startTime = new Date().getTime()

      await new Promise((resolve, reject) => {
        let count = 0
        m.on('join', () => {
          try {
            const stopTime = new Date().getTime()
            const deltaTime = stopTime - startTime
            assert.equal(deltaTime >= interval, true)
            assert.equal(deltaTime < interval + margin, true, `Not within margin of ${margin} ms`)
            resolve()
          } catch (e) {
            reject(e)
          }
        })
      })
    })
  })
})
