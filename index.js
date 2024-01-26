const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');
const { MongoClient } = require('mongodb');
dotenv.config({ path: 'config.env' });
const ObjectId= require('mongodb');
const app = express();
const bcrypt = require('bcryptjs');
const PORT = process.env.PORT;


// Start the server &server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

  
// Middleware setup
app.use(morgan('dev'));
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, 'assets')));


// MongoDB connection
const url = 'mongodb+srv://mail1project1:team123456@cluster0.kcqny2i.mongodb.net/?retryWrites=true&w=majority';
const dbName = 'Help_me_Emergency';

async function connectDB() {
  const client = new MongoClient(url);

  try {
    await client.connect();
    console.log('Connected to the database');
    return client.db(dbName);
  } catch (error) {
    console.error('Error connecting to the database:', error);
    throw error;
  }
  // client.disconnect();
  // console.log('unConnected');
}
connectDB();

////////////////////////////////// APIs of Emergency
//GET All Emergency
app.get('/api/emergency/all', async (req, res) => {
    try {
      const db = await connectDB();
      const collection = db.collection('emergency');
      const result = await collection.find().toArray();
    
      res.json(result);
    } catch (error) {
      console.error('Error reading emergencies:', error);
      res.status(500).send('Internal Server Error');
    }
  });

//GET one Emergency by id
  app.get('/api/emerency/:id', async (req, res) => {
    try {
      const db = await connectDB();
      const collection = db.collection('emergency');
  
      // Extract the ID parameter from the request URL
      const emergencyId = parseInt(req.params.id);
  
      // Query the collection for the specific emergency with the given ID
      const result = await collection.findOne({ id: emergencyId });
  
      if (result) {
        // Set Content-Type header to application/json
        res.header('Content-Type', 'application/json');
  
        // Send the result as a JSON object with indentation for better readability
        res.send(JSON.stringify(result, null, 2));
      } else {
        res.status(404).send('Emergency not found');
      }
    } catch (error) {
      console.error('Error reading emergency by ID:', error);
      res.status(500).send('Internal Server Error');
    }
  });

//   CREATE new Emergency
  app.post('/api/emerency/add/', async (req, res) => {
    try {
      const db = await connectDB();
      const collection = db.collection('emergency');
  
      // Extract emergency data from the request body
      const newEmergencyData = req.body;
  
      // Insert the new emergency document into the collection
      const result = await collection.insertOne(newEmergencyData);

      if (result){
        res.send('created');
      } else {
        res.send('failed');
      }
      console.log(result);
      // if (result.insertedCount > 0) {
      //   res.status(201).send('Emergency created successfully');
      //    console.log(result);
      // }
      // } else {
      //   res.status(500).send('Failed to create emergency');
      //   console.log(result);
      // }
    } catch (error) {
      console.error('Error creating new emergency:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  //DELETE emergency 
  app.delete('/api/emerency/:id', async (req, res) => {
    try {
      const db = await connectDB();
      const collection = db.collection('emergency');
  
      // Extract the ID parameter from the request URL
      const emergencyId = parseInt(req.params.id);
  
      // Delete the emergency with the given ID
      const result = await collection.deleteOne({ id: emergencyId });
  
      if (result.deletedCount > 0) {
        res.status(200).send('Emergency deleted successfully');
      } else {
        res.status(404).send('Emergency not found');
      }
    } catch (error) {
      console.error('Error deleting emergency by ID:', error);
      res.status(500).send('Internal Server Error');
    }
  });

 

///////////////////////////////////////////LOG in & Register 
const Patient = require('./models/patientModel');
//register
//   app.post('/api/register', async (req, res) => {
//     try {
//       //register patient
//       const db = await connectDB();
//       const collection = db.collection('patient');
//       const result = await collection.find().toArray();
//       const { name, email,password,confirmPassword} = req.body;
  
//       // Check if the email already exists
//       const existingPatient = await collection.findOne({ email });
  
//       if (existingPatient) {
//         return res.status(400).json({ error: 'Email already exists' });
//       }
  
//    // Create a new patient instance using the Patient model
//      const newPatient = new Patient({ name, email, password, confirmPassword });

//   if(confirmPassword !=password){
//       res.send('password not match please try again');
//     } 

// // Save the patient to the database
// await collection.insertOne(newPatient);

//       res.status(201).json({ message: 'User registered successfully' });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
// });

app.post('/api/register', async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection('patient');

    const {name,email, password,confirmPassword,gender,phone,photo,location,qr } = req.body;

    // Check if the patient with the given email already exists
    const existingPatient = await collection.findOne({ email });

    if (existingPatient) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash the password before storing it in the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new patient object with the hashed password
    const newPatient = {
      name,
      email,
      password: hashedPassword,
      confirmPassword: hashedPassword,
      gender,
      phone,
      photo,
      location,
      qr
    };


      if (password !=confirmPassword ) {
      return res.status(401).json({ error: 'enter password again' });
    } 
    // Insert the new patient into the database
    await collection.insertOne(newPatient);

    res.status(201).json({ message: 'Registration successful' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//log in 
app.post('/api/login', async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection('patient');

    const { email, password } = req.body;

    // Check if the patient with the given email exists
    const patient = await collection.findOne({ email });

    if (!patient) {
      return res.status(401).json({ error: 'Invalid email' });
    }

    // Use bcrypt to compare the provided password with the hashed password stored in the database
    const isPasswordValid = await bcrypt.compare(password, patient.password);

    if (!isPasswordValid ) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // You might generate a token here and send it back to the client for authentication in future requests
    // For simplicity, let's just send a success message
    res.status(200).json("Login done");

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

////////////////////////////////// APIs of Courses
// 1- Read all courses 
app.get('/api/courses/all', async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection('courses');
    const result = await collection.find().toArray();
    console.log(result);
    res.json(result);
  } catch (error) {
    console.error('Error reading emergencies:', error);
    res.status(500).send('Internal Server Error');
  }
});

//Search about one course by id 
app.get('/api/course/:id', async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection('courses');

    // Extract the ID parameter from the request URL
    const courseId = parseInt(req.params.id);

    // Query the collection for the specific emergency with the given ID
    const result = await collection.findOne({ id: courseId });

    if (result) {
      // Set Content-Type header to application/json
      // res.header('Content-Type', 'application/json');

      // Send the result as a JSON object with indentation for better readability
      res.send(JSON.stringify(result, null, 2));
    } else {
      res.status(404).send('Course not found');
    }
  } catch (error) {
    console.error('Error reading emergency by ID:', error);
    res.status(500).send('Internal Server Error');
  }
});