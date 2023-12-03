import mongoose from 'mongoose';

const connectDB = async () => {
  console.log("Trying to Connect DB")
  try {
    let mongoURI = process.env.ENVIRONMENT==="live"? process.env.MONGO_URI_LIVE: process.env.MONGO_URI;
    const conn = await mongoose.connect(mongoURI, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });
    console.log(`MongoDB Connections: ${conn.connection.host}`);
  } catch (error) {
    console.log('Error Test')
    console.error(`${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
