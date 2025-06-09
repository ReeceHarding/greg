/*
 * This script fixes a user's role by updating their custom claims
 * Run with: npx tsx scripts/fix-user-role.ts <email>
 */

// Load environment variables
import dotenv from "dotenv"
import path from "path"

// Load .env.local file
const envPath = path.resolve(process.cwd(), ".env.local")
console.log("Loading environment from:", envPath)
const result = dotenv.config({ path: envPath })

if (result.error) {
  console.error("Failed to load .env.local:", result.error)
} else {
  console.log("Environment variables loaded successfully")
  console.log("FIREBASE_SERVICE_ACCOUNT_PATH:", process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
}

import { adminAuth, adminDb } from "../lib/firebase-config"

async function fixUserRole(email: string) {
  console.log(`\n🔧 Fixing role for user: ${email}\n`)
  
  try {
    // Check if Firebase is initialized
    if (!adminAuth || !adminDb) {
      console.error("❌ Firebase Admin SDK not initialized")
      console.error("   Please check your Firebase configuration")
      console.error("   FIREBASE_SERVICE_ACCOUNT_PATH:", process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
      process.exit(1)
    }
    
    // Get user by email
    console.log("1. Looking up user by email...")
    const userRecord = await adminAuth.getUserByEmail(email)
    console.log(`   Found user: ${userRecord.uid}`)
    
    // Check if email is in adminEmails collection
    console.log("\n2. Checking admin emails collection...")
    const adminEmailsSnapshot = await adminDb
      .collection("adminEmails")
      .where("email", "==", email)
      .get()
    
    const isAdmin = !adminEmailsSnapshot.empty
    console.log(`   Is admin: ${isAdmin}`)
    
    // Set custom claims
    console.log("\n3. Setting custom claims...")
    const role = isAdmin ? "admin" : "student"
    await adminAuth.setCustomUserClaims(userRecord.uid, { role })
    console.log(`   ✅ Set role to: ${role}`)
    
    // Revoke existing sessions to force re-authentication
    console.log("\n4. Revoking existing sessions...")
    await adminAuth.revokeRefreshTokens(userRecord.uid)
    console.log("   ✅ Sessions revoked")
    
    console.log("\n✅ User role fixed successfully!")
    console.log("\nIMPORTANT: The user must:")
    console.log("1. Sign out from the application")
    console.log("2. Clear browser cookies for localhost:3005")
    console.log("3. Sign back in")
    console.log("4. They should now have the correct role")
    
  } catch (error: any) {
    console.error("\n❌ Error fixing user role:", error.message)
    if (error.code === "auth/user-not-found") {
      console.error("   User with this email not found")
    }
  }
  
  process.exit(0)
}

// Get email from command line arguments
const email = process.argv[2]

if (!email) {
  console.error("❌ Please provide an email address")
  console.log("Usage: npx tsx scripts/fix-user-role.ts <email>")
  process.exit(1)
}

fixUserRole(email) 