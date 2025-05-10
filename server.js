const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mydb';
const DB_NAME = process.env.DB_NAME || 'usersdb';
const COLLECTION_NAME = 'users';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.json());

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// MongoDB connection variables
let db;
let collection;

// Connect to MongoDB
async function connectToDatabase() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    
    db = client.db(DB_NAME);
    collection = db.collection(COLLECTION_NAME);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Helper function to parse query filters
const parseFilter = (filterStr) => {
  try {
    const filter = JSON.parse(filterStr || '{}');
    return filter;
  } catch (error) {
    return {};
  }
};

// Insert one document
app.post('/insertOne', async (req, res) => {
  try {
    const document = req.body;
    
    if (!document || Object.keys(document).length === 0) {
      return res.status(400).json({ error: 'Document is required' });
    }
    
    const result = await collection.insertOne(document);
    res.json({ 
      acknowledged: result.acknowledged,
      insertedId: result.insertedId 
    });
  } catch (error) {
    console.error('Error inserting document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Insert many documents
app.post('/insertMany', async (req, res) => {
  try {
    const { users } = req.body;
    
    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: 'Documents array is required' });
    }
    
    const result = await collection.insertMany(users);
    res.json({ 
      acknowledged: result.acknowledged,
      insertedCount: result.insertedCount,
      insertedIds: result.insertedIds
    });
  } catch (error) {
    console.error('Error inserting documents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Find documents
app.get('/find', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      
      let filter = {};
      if (req.query.filter) {
        try {
          filter = JSON.parse(req.query.filter);
        } catch (parseError) {
          console.error('Error parsing filter:', parseError, req.query.filter);
          return res.status(400).json({ error: 'Invalid filter format' });
        }
      }
      
      // Don't convert _id to ObjectId, leave as string
      const options = {};
      if (req.query.limit) options.limit = parseInt(req.query.limit);
      if (req.query.skip) options.skip = parseInt(req.query.skip);
      
      if (req.query.sortField && req.query.sortField !== 'none') {
        options.sort = {
          [req.query.sortField]: req.query.sortOrder === 'desc' ? -1 : 1
        };
      }
      
      console.log('Find query:', filter, options);
      
      const cursor = collection.find(filter, options);
      const documents = await cursor.toArray();
      
      res.json({ count: documents.length, documents });
    } catch (error) {
      console.error('Error finding documents:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
// Find one document
app.get('/findOne', async (req, res) => {
    try {
      const filter = parseFilter(req.query.filter);
      
      const document = await collection.findOne(filter);
      
      if (!document) {
        return res.json(null); // Return null instead of 404 to match UI expectations
      }
      
      res.json(document);
    } catch (error) {
      console.error('Error finding document:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
// Update one document
app.put('/updateOne', async (req, res) => {
  try {
    const { filter, update } = req.body;
    
    if (!filter || Object.keys(filter).length === 0) {
      return res.status(400).json({ error: 'Filter is required' });
    }
    
    if (!update || !update.$set || Object.keys(update.$set).length === 0) {
      return res.status(400).json({ error: 'Update document is required' });
    }
    
    const result = await collection.updateOne(filter, update);
    res.json({
      acknowledged: result.acknowledged,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update many documents
app.put('/updateMany', async (req, res) => {
  try {
    const { filter, update } = req.body;
    
    if (!update || !update.$set || Object.keys(update.$set).length === 0) {
      return res.status(400).json({ error: 'Update document is required' });
    }
    
    const result = await collection.updateMany(filter || {}, update);
    res.json({
      acknowledged: result.acknowledged,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating documents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Replace one document
app.put('/replaceOne', async (req, res) => {
  try {
    const { filter, replacement } = req.body;
    
    if (!filter || Object.keys(filter).length === 0) {
      return res.status(400).json({ error: 'Filter is required' });
    }
    
    if (!replacement || Object.keys(replacement).length === 0) {
      return res.status(400).json({ error: 'Replacement document is required' });
    }
    
    const result = await collection.replaceOne(filter, replacement);
    res.json({
      acknowledged: result.acknowledged,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error replacing document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete one document
app.delete('/deleteOne', async (req, res) => {
  try {
    const filter = parseFilter(req.query.filter);
    
    if (!filter || Object.keys(filter).length === 0) {
      return res.status(400).json({ error: 'Filter is required' });
    }
    
    const result = await collection.deleteOne(filter);
    res.json({
      acknowledged: result.acknowledged,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete many documents
app.delete('/deleteMany', async (req, res) => {
  try {
    const filter = parseFilter(req.query.filter);
    
    const result = await collection.deleteMany(filter || {});
    res.json({
      acknowledged: result.acknowledged,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting documents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Count documents
app.get('/count', async (req, res) => {
  try {
    const filter = parseFilter(req.query.filter);
    
    const count = await collection.countDocuments(filter);
    res.json({ count });
  } catch (error) {
    console.error('Error counting documents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get distinct values
app.get('/distinct', async (req, res) => {
  try {
    const field = req.query.field;
    
    if (!field) {
      return res.status(400).json({ error: 'Field is required' });
    }
    
    const values = await collection.distinct(field);
    res.json(values);
  } catch (error) {
    console.error('Error getting distinct values:', error);
    res.status(500).json({ error: error.message });
  }
});

// Perform aggregation
app.post('/aggregate', async (req, res) => {
    try {
      const { pipeline } = req.body;
      
      if (!Array.isArray(pipeline)) {
        return res.status(400).json({ error: 'Aggregation pipeline must be an array' });
      }
      
      const result = await collection.aggregate(pipeline).toArray();
      res.json(result);
    } catch (error) {
      console.error('Error performing aggregation:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create index
app.post('/createIndex', async (req, res) => {
    try {
      const { keys, options } = req.body;
      
      if (!keys) {
        return res.status(400).json({ error: 'Index keys are required' });
      }
      
      const result = await collection.createIndex(keys, options || {});
      res.json({ indexName: result, message: 'Index created successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message, message: 'Error creating index' });
    }
  });
  // Drop index
app.post('/dropIndex', async (req, res) => {
  try {
    const { indexName } = req.body;
    
    if (!indexName) {
      return res.status(400).json({ error: 'Index name is required' });
    }
    
    const result = await collection.dropIndex(indexName);
    res.json(result);
  } catch (error) {
    console.error('Error dropping index:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all indexes
app.get('/getIndexes', async (req, res) => {
  try {
    const indexes = await collection.indexes();
    res.json(indexes);
  } catch (error) {
    console.error('Error getting indexes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Find one and update
app.post('/findOneAndUpdate', async (req, res) => {
  try {
    const { filter, update, options } = req.body;
    
    if (!filter || !update) {
      return res.status(400).json({ error: 'Filter and update are required' });
    }
    
    const parsedFilter = parseFilter(filter);
    const updateDoc = { $set: update };
    
    const result = await collection.findOneAndUpdate(
      parsedFilter,
      updateDoc,
      {
        returnDocument: options?.returnDocument || 'after',
        ...options
      }
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error finding and updating document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Find one and delete
app.post('/findOneAndDelete', async (req, res) => {
  try {
    const filter = parseFilter(req.body);
    
    const result = await collection.findOneAndDelete(filter);
    res.json(result);
  } catch (error) {
    console.error('Error finding and deleting document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk write operations
app.post('/bulkWrite', async (req, res) => {
  try {
    const { operations } = req.body;
    
    if (!Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({ error: 'Operations array is required' });
    }
    
    const result = await collection.bulkWrite(operations);
    res.json({
      acknowledged: result.acknowledged,
      insertedCount: result.insertedCount,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      deletedCount: result.deletedCount,
      upsertedCount: result.upsertedCount,
      upsertedIds: result.upsertedIds
    });
  } catch (error) {
    console.error('Error performing bulk write operations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Find one and replace
app.post('/findOneAndReplace', async (req, res) => {
  try {
    const { filter, replacement, options } = req.body;
    
    if (!filter || !replacement) {
      return res.status(400).json({ error: 'Filter and replacement document are required' });
    }
    
    const parsedFilter = parseFilter(filter);
    
    const result = await collection.findOneAndReplace(
      parsedFilter,
      replacement,
      {
        returnDocument: options?.returnDocument || 'after',
        ...options
      }
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error finding and replacing document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rename collection
app.post('/renameCollection', async (req, res) => {
    try {
      const { oldName, newName } = req.body;
  
      if (!oldName || !newName) {
        return res.status(400).json({ error: 'Old and new collection names are required' });
      }
  
      const collections = await db.listCollections({ name: oldName }).toArray();
      if (collections.length === 0) {
        return res.status(404).json({ error: `Collection "${oldName}" does not exist` });
      }

      const collectionToRename = db.collection(oldName);
      await collectionToRename.rename(newName);
  
      res.json({ acknowledged: true, message: `Collection renamed from "${oldName}" to "${newName}"` });
    } catch (error) {
      console.error('Error renaming collection:', error);
      res.status(500).json({ error: error.message });
    }
  });
  

// Drop collection
app.post('/drop', async (req, res) => {
    try {
      const { collectionName } = req.body;
      if (!collectionName) {
        return res.status(400).json({ error: 'Collection name is required' });
      }
  
      const collectionToDrop = db.collection(collectionName);
      const result = await collectionToDrop.drop();
  
      res.json({ dropped: result, message: `Collection "${collectionName}" dropped successfully.` });
    } catch (error) {
      console.error('Error dropping collection:', error);
      res.status(500).json({ error: error.message });
    }
  });
  

// List collections
app.get('/listCollections', async (req, res) => {
  try {
    const collections = await db.listCollections().toArray();
    res.json(collections);
  } catch (error) {
    console.error('Error listing collections:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
async function startServer() {
    await connectToDatabase();
  
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
  
  // Add global error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
  });
  
  // Start the server and handle connection
  startServer().catch(console.error);
  
  // Gracefully handle shutdown and close database connection
  process.on('SIGINT', async () => {
    console.log('Closing server...');
    await db.client.close(); // Close MongoDB connection
    process.exit(0);
  });
