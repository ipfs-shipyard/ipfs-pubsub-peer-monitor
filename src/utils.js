'use strict'

// Set utils
const difference = (set1, set2) => new Set([...set1].map(x => String(x)).filter(x => ![...set2].map(x => String(x)).includes(x)))

// Poll utils
const sleep = (time) => new Promise(resolve => setTimeout(resolve, time))

const runWithDelay = async (func, topic, interval) => {
  const peers = await func(topic)
  await sleep(interval)
  return peers
}

module.exports.runWithDelay = runWithDelay
module.exports.difference = difference
