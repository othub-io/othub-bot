#!/bin/bash

source ~/othub-bot/.env

mysql -u $USER -p$PASSWORD <<EOF
CREATE DATABASE $BOT_DB;
USE $BOT_DB;

CREATE TABLE alliance_members (
  adminKey VARCHAR(255),
  telegramID VARCHAR(255),
  botToken VARCHAR(255),
  nodeGroup VARCHAR(255)
);

CREATE TABLE command_history (
  tg_id INT,
  command VARCHAR(255),
  date_last_used DATE
);

CREATE TABLE commit_history (
  hourly INT,
  daily INT,
  weekly INT,
  monthly INT,
  yearly INT,
  total INT
);

CREATE TABLE compliance (
  nodeId INT,
  warnings VARCHAR(255)
);

CREATE TABLE monitor (
  networkId INT,
  ask VARCHAR(255)
);

CREATE TABLE node_compliance (
  network_id INT,
  tg_id INT,
  type VARCHAR(255),
  warnings VARCHAR(255)
);

CREATE TABLE node_operators (
  adminKey VARCHAR(255),
  keccak256hash VARCHAR(255),
  telegramID VARCHAR(255),
  botToken VARCHAR(255),
  nodeGroup VARCHAR(255)
);

CREATE TABLE publish_history (
  hourly INT,
  daily INT,
  weekly INT,
  monthly INT,
  yearly INT,
  total INT
);

CREATE TABLE request_history (
  request VARCHAR(255),
  date_last_used DATE,
  ip_used VARCHAR(255),
  api_key VARCHAR(255)
);

CREATE TABLE txn_header (
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
);

CREATE TABLE user_header (
  api_key VARCHAR(255),
  admin_key VARCHAR(255),
  app_name VARCHAR(255),
  access VARCHAR(255)
);
EOF
