const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const connectionConfig = {
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
};

async function createDatabaseAndTables() {
  try {
    const connection = await mysql.createConnection(connectionConfig);

    await connection.query(`CREATE DATABASE ${process.env.OTHUB_DB}`);
    await connection.query(`USE ${process.env.OTHUB_DB}`);

    await connection.query(`CREATE TABLE alliance_members (
      adminKey VARCHAR(255),
      telegramID VARCHAR(255),
      botToken VARCHAR(255),
      nodeGroup VARCHAR(255)
    )`);

    await connection.query(`CREATE TABLE command_history (
      tg_id INT,
      command VARCHAR(255),
      date_last_used DATE
    )`);

    await connection.query(`CREATE TABLE commit_history (
      hourly INT,
      daily INT,
      weekly INT,
      monthly INT,
      yearly INT,
      total INT
    )`);

    await connection.query(`CREATE TABLE compliance (
      nodeId INT,
      warnings VARCHAR(255)
    )`);

    await connection.query(`CREATE TABLE monitor (
      networkId INT,
      ask VARCHAR(255)
    )`);

    await connection.query(`CREATE TABLE node_compliance (
      network_id INT,
      tg_id INT,
      type VARCHAR(255),
      warnings VARCHAR(255)
    )`);

    await connection.query(`CREATE TABLE node_operators (
      adminKey VARCHAR(255),
      keccak256hash VARCHAR(255),
      telegramID VARCHAR(255),
      botToken VARCHAR(255),
      nodeGroup VARCHAR(255)
    )`);

    await connection.query(`CREATE TABLE publish_history (
      hourly INT,
      daily INT,
      weekly INT,
      monthly INT,
      yearly INT,
      total INT
    )`);

    await connection.query(`CREATE TABLE request_history (
      request VARCHAR(255),
      date_last_used DATE,
      ip_used VARCHAR(255),
      api_key VARCHAR(255)
    )`);

    await connection.query(`CREATE TABLE txn_header (
      txn_id INT,
      owner_address VARCHAR(255),
      action VARCHAR(255),
      type VARCHAR(255),
      keywords VARCHAR(255),
      timestamp TIMESTAMP,
      ual VARCHAR(255),
      assertionId INT,
      operationId INT,
      status VARCHAR(255),
      data VARCHAR(255),
      otp_fee DECIMAL(10,2),
      trac_fee DECIMAL(10,2),
      epochs INT
    )`);

    await connection.query(`CREATE TABLE user_header (
      api_key VARCHAR(255),
      admin_key VARCHAR(255),
      app_name VARCHAR(255),
      access VARCHAR(255)
    )`);

    await connection.end();

    console.log('Database and tables created successfully.');
  } catch (error) {
    console.error('Error creating database and tables:', error);
  }
}

createDatabaseAndTables();
