/** @format */

const express = require("express");
const bodyParser = require("body-parser");
const oracledb = require("oracledb");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 5000;
const jwtSecret = "your_jwt_secret";

app.use(bodyParser.json());
app.use(cors());

// OracleDB connection
const dbConfig = {
  user: "system",
  password: "10052000",
  connectString: "localhost:1521/orcl",
};

async function initializeDBConnection() {
  try {
    oracledb.initOracleClient({ libDir: 'D:\\instantclient_21_14' }); // Update this path

    await oracledb.createPool(dbConfig);
    console.log("Connected to OracleDB");
    return true; // Return true indicating successful connection
  } catch (err) {
    console.error("Error connecting to OracleDB", err);
    return false; // Return false indicating failed connection
  }
}


// Endpoint to search for data based on a search term
app.get('/api/search', async (req, res) => {
  let connection;

  try {
    const searchTerm = req.query.searchTerm;
    console.log(searchTerm);
    oracledb.initOracleClient({ libDir: 'D:\\instantclient_21_14' }); // Update this path

    // Get a connection to the Oracle DB
    connection = await oracledb.getConnection(dbConfig);

    // Construct the SQL query dynamically to search across multiple columns
    const query = `
      SELECT * FROM DOCUMENT 
      WHERE 
        EVENTNUMBER LIKE '%${searchTerm}%' OR
        EVENTVERSION LIKE '%${searchTerm}%' OR
        EVENTTYPE LIKE '%${searchTerm}%' OR
        EVENT LIKE '%${searchTerm}%' OR
        ENTITYSTATUS LIKE '%${searchTerm}%' OR
        EVENTTYPESHORTCODE LIKE '%${searchTerm}%' OR
        JOURNALDATE LIKE '%${searchTerm}%' OR
        WITHUPDATEDACCOUNTEDDATE LIKE '%${searchTerm}%' OR
        CREATEDBY LIKE '%${searchTerm}%' OR
        OFFICEIDEVENT LIKE '%${searchTerm}%' OR
        USECASETYPE LIKE '%${searchTerm}%' OR
        INTERNALID LIKE '%${searchTerm}%' OR
        PRIMARYDOCUMENTNBR LIKE '%${searchTerm}%' OR
        TYPE_DOC LIKE '%${searchTerm}%' OR
        DOCUMENTOPERATIONALSTATUS LIKE '%${searchTerm}%' OR
        ISSUEINDICATOR LIKE '%${searchTerm}%' OR
        TRANSACTIONCODE LIKE '%${searchTerm}%' OR
        TRANSACTIONTYPE LIKE '%${searchTerm}%' OR
        NUMBEROFCONJUNCTIVETICKETS LIKE '%${searchTerm}%' OR
        REASONFORISSUANCECODE LIKE '%${searchTerm}%' OR
        EMDREMARK LIKE '%${searchTerm}%' OR
        FULLROUTING LIKE '%${searchTerm}%' OR
        VALIDATINGCARRIER LIKE '%${searchTerm}%' OR
        REASONFORISSUANCEDESCRIPTION LIKE '%${searchTerm}%' OR
        DATEOFISSUANCE LIKE '%${searchTerm}%' OR
        VALIDATINGAIRLINEALLIANCECODE LIKE '%${searchTerm}%' OR
        ORIGINALISSUEINFOFREEFLOW LIKE '%${searchTerm}%' OR
        CODE LIKE '%${searchTerm}%' OR
        ACQUISITIONTYPE LIKE '%${searchTerm}%' OR
        INVOLUNTARYINDICATOR LIKE '%${searchTerm}%' OR
        ISLAFAPPLIEDINDICATOR LIKE '%${searchTerm}%' OR
        ISREDEMPTIONTICKET LIKE '%${searchTerm}%' OR
        ISREDEMPTIONWITHFARETICKET LIKE '%${searchTerm}%' OR
        ISSCHEDULECHANGE LIKE '%${searchTerm}%' OR
        AGENCYNAME LIKE '%${searchTerm}%' OR
        AGENCYGROUPNAME LIKE '%${searchTerm}%'
    `;
    
    // Execute the constructed SQL query
    const result = await connection.execute(query);

    // Send the search results as JSON response
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching data:', error);
    res.status(500).json({ error: 'Error searching data' });
  } finally {
    // Release the Oracle DB connection
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    }
  }
});

// Register
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  let connection;
  try {
    oracledb.initOracleClient({ libDir: 'D:\\instantclient_21_14' }); // Update this path

    connection = await oracledb.getConnection();
    await connection.execute(
      `INSERT INTO USERS (username, password) VALUES (:username, :password)`, // Corrected SQL query
      { username, password: hashedPassword } // Provide actual values for placeholders
    );
    await connection.commit();

    // Generate token
    const token = jwt.sign({ username }, jwtSecret, { expiresIn: "1h" });
    res.status(201).json({ token }); // Send token in response
  } catch (err) {
    console.error("Error registering user:", err); // Log error for debugging
    res.status(500).send("Error registering user");
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  let connection;
  try {
    oracledb.initOracleClient({ libDir: 'D:\\instantclient_21_14' }); // Update this path

    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `SELECT password FROM USERS WHERE username = :username`,
      { username }
    );

    const user = result.rows[0];
    if (user && user[0]) {
      const hashedPasswordFromDB = user[0]; // Assuming the hashed password is stored in the first column

      const match = await bcrypt.compare(password, hashedPasswordFromDB);

      if (match) {
        const token = jwt.sign({ username }, jwtSecret, { expiresIn: "1h" });
        res.status(200).json({ token }); // Send token in response
      } else {
        console.log("Invalid password"); // Log invalid password
        res.status(401).send("Invalid credentials");
      }
    } else {
      console.log("User not found or hashed password is missing"); // Log user not found or missing hashed password
      res.status(401).send("Invalid credentials");
    }
  } catch (err) {
    console.error("Error logging in:", err); // Log login error
    res.status(500).send("Error logging in");
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

initializeDBConnection().then((connected) => {
  if (connected) {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } else {
    console.error("Database connection failed. Server cannot start.");
  }
});
