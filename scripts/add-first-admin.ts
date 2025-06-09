import { db } from "../db/db"
import { FieldValue } from "firebase-admin/firestore"

// Script to add the first admin email to the system
async function addFirstAdmin() {
  const adminEmail = process.argv[2]
  
  if (!adminEmail) {
    console.error("Please provide an email address as argument")
    console.error("Usage: npm run add-admin email@example.com")
    process.exit(1)
  }

  if (!db) {
    console.error("❌ Firebase is not initialized. Please check your configuration.")
    process.exit(1)
  }

  try {
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