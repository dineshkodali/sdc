// scripts/createAdmin.js
import bcrypt from "bcryptjs";
import pool from "../config/db.js"; // adjust path if needed
import dotenv from "dotenv";
// import { ADMIN_CREDENTIALS } from "../config/adminCredentials.js";
// import admin from "../config/admin.json" assert { type: "json" };
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_NAME:", process.env.DB_NAME);

// Read admin.json safely
const adminPath = path.join(__dirname, "../config/admin.json");
const admin = JSON.parse(fs.readFileSync(adminPath, "utf-8"));
console.log("admin1111111111",admin);



const run = async () => {
  try {
    // const email = process.env.ADMIN_EMAIL; 
    // ?? "kiren@gmail.com";
    // const password = process.env.ADMIN_PASSWORD;
    //  ?? "kiren123";
    // const name = "Site Admin";
    // const { email, password, name } = ADMIN_CREDENTIALS;

    const { email, password, name } = admin;

    if (!email || !password) {
      throw new Error("admin.json must contain email and password");
    }

    const hashed = await bcrypt.hash(password, 10);

    // You may want to check if admin already exists
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length) {
      console.log("Admin already exists:", existing.rows[0].id);
      process.exit(0);
    }

    const res = await pool.query(
      `INSERT INTO users (name, email, password, role, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email`,
      [name, email, hashed, "admin", "active"]
    );

    console.log("Admin created:", res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error("Error creating admin:", err);
    process.exit(1);
  }
};

run();
