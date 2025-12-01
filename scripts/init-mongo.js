// MongoDB initialization script
// This script initializes MongoDB with the necessary replica set configuration
// Prisma requires a replica set for MongoDB transactions

db = db.getSiblingDB('admin');

// Create admin user if it doesn't exist
try {
  db.createUser({
    user: process.env.MONGO_ROOT_USERNAME || 'admin',
    pwd: process.env.MONGO_ROOT_PASSWORD || 'change_me_secure_password',
    roles: ['root']
  });
  print('Admin user created');
} catch (e) {
  print('Admin user may already exist');
}

// Initialize replica set if not already initialized
try {
  var config = {
    _id: 'rs0',
    members: [
      { _id: 0, host: 'localhost:27017' }
    ]
  };
  rs.initiate(config);
  print('Replica set initialized');
} catch (e) {
  if (e.code === 103) {
    print('Replica set already initialized');
  } else {
    print('Error initializing replica set: ' + e);
  }
}

