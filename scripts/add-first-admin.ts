import * as dotenv from 'dotenv'
import path from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import * as fs from 'fs'

// Load environment variables first
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Script to add the first admin email to the system
async function addFirstAdmin() {
  const adminEmail = process.argv[2]
  
  if (!adminEmail) {
    console.error("Please provide an email address as argument")
    console.error("Usage: npm run add-admin email@example.com")
    process.exit(1)
  }

  try {
    // Initialize Firebase Admin directly
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    
    if (!serviceAccountPath) {
      console.error("❌ FIREBASE_SERVICE_ACCOUNT_PATH not set in environment")
      process.exit(1)
    }

    if (!fs.existsSync(serviceAccountPath)) {
      console.error("❌ Service account file not found at:", serviceAccountPath)
      process.exit(1)
    }

    console.log("🔧 Initializing Firebase Admin SDK...")
    
    // Check if app already exists
    let app
    if (getApps().length === 0) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
      app = initializeApp({
        credential: cert(serviceAccount)
      })
    } else {
      app = getApps()[0]
    }

    const db = getFirestore(app)
    
    console.log(`Adding ${adminEmail} as admin...`)

    // Add to adminEmails collection
    await db.collection("adminEmails").doc(adminEmail).set({
      email: adminEmail,
      addedBy: "system",
      addedAt: FieldValue.serverTimestamp()
    })

    console.log("✅ Admin email added successfully!")
    console.log("\nNext steps:")
    console.log("1. Sign out from the application")
    console.log("2. Sign back in with this email")
    console.log("3. You should now have admin access")
    
    process.exit(0)
  } catch (error) {
    console.error("❌ Error adding admin email:", error)
    process.exit(1)
  }
}

addFirstAdmin() 