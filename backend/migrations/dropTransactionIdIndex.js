const mongoose = require('mongoose');
require('dotenv').config();

const URI = process.env.MONGO_URI || 'mongodb://localhost:27017/test';

async function dropTransactionIdIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(URI);

    const db = mongoose.connection.db;
    const collection = db.collection('transactions');

    console.log('Dropping transactionId_1 index...');
    try {
      await collection.dropIndex('transactionId_1');
      console.log('✓ Successfully dropped transactionId_1 index');
    } catch (err) {
      if (err.code === 27) {
        console.log('✓ Index does not exist (already removed)');
      } else {
        throw err;
      }
    }

    // List remaining indexes
    const indexes = await collection.getIndexes();
    console.log('\nRemaining indexes:');
    console.table(indexes);

    console.log('\n✓ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

dropTransactionIdIndex();
