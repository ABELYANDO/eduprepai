// ── migrateStructuredToEssay ─────────────────────────────────────
// One-off script: the 'Structured' question type has been removed —
// the system now only has 'MCQ' and 'Essay' (Question.model.js's
// `type` enum). Multi-part structured answers still work exactly as
// before; what used to be signalled by `type: 'Structured'` is now
// just `type: 'Essay'` with a populated `parts` array (the `parts`
// field is unaffected by this migration — only `type` changes).
//
// Usage: npm run questions:migrate-structured-to-essay   (from server/)

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join }  from 'path'
import mongoose from 'mongoose'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('\n❌ MONGODB_URI is missing from your .env file\n')
  process.exit(1)
}

// Reads via the native driver, not the Mongoose model — the model's
// schema no longer allows 'Structured' in its `type` enum, but the
// aggregation still needs to see documents carrying the old value.
const groupCounts = (filter) =>
  mongoose.connection.collection('questions').aggregate([
    { $match: filter },
    { $group: { _id: { subject: '$subject', examType: '$examType', questionSource: '$questionSource' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]).toArray()

const run = async () => {
  await mongoose.connect(MONGODB_URI, { dbName: 'eduprepai' })

  try {
    const before = await groupCounts({ type: 'Structured' })
    if (before.length === 0) {
      console.log('\n✅ No Structured questions found — nothing to migrate\n')
      return
    }

    console.log(`\nFound ${before.reduce((s, r) => s + r.count, 0)} Structured question(s) to migrate:\n`)
    before.forEach(r => {
      console.log(`   ${r._id.subject} (${r._id.examType}, ${r._id.questionSource || 'unclassified'}): ${r.count}`)
    })

    const result = await mongoose.connection.collection('questions').updateMany(
      { type: 'Structured' },
      { $set: { type: 'Essay' } }
    )
    console.log(`\n✅ Migrated: ${result.modifiedCount} question(s) → type: 'Essay'\n`)

    const after = await groupCounts({ type: 'Essay' })
    console.log(`Total Essay questions now in the bank: ${after.reduce((s, r) => s + r.count, 0)}\n`)

  } finally {
    await mongoose.disconnect()
  }
}

run().catch(err => {
  console.error('\n❌ migrateStructuredToEssay failed:', err.message)
  process.exit(1)
})
