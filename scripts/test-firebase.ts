/*
 * This script tests Firebase connection and Firestore access
 * Run with: npm run test:firebase
 */

import { adminAuth, adminDb, adminStorage } from "../lib/firebase-config"

async function testFirebase() {
  console.log("\n🔍 Testing Firebase Connection\n")
  console.log("================================\n")

  try {
    // Test Firebase Admin SDK initialization
    console.log("1. Testing Firebase Admin SDK...")
    
    if (adminAuth || adminDb || adminStorage) {
      console.log("✅ Firebase Admin SDK initialized successfully")
      console.log("   Services available:")
      if (adminAuth) console.log("   - Authentication")
      if (adminDb) console.log("   - Firestore")
      if (adminStorage) console.log("   - Storage")
    } else {
      console.log("❌ Firebase Admin SDK not initialized")
      console.log("   Please check your service account configuration")
    }

    // Test Firestore connection
    console.log("\n2. Testing Firestore connection...")
    if (adminDb) {
      try {
        // Try to list collections
        const collections = await adminDb.listCollections()
        const collectionIds = collections.map(col => col.id)
        
        if (collectionIds.length > 0) {
          console.log("✅ Firestore connected! Found collections:")
          collectionIds.forEach(id => console.log(`   - ${id}`))
        } else {
          console.log("✅ Firestore connected (no collections yet)")
          console.log("   This is normal for a new database")
        }
      } catch (firestoreError: any) {
        console.error("❌ Firestore error:", firestoreError.message)
        
        if (firestoreError.code === 5 || firestoreError.message?.includes('NOT_FOUND')) {
          console.log("\n⚠️  Firestore database might not be created yet.")
          console.log("   Please ensure Firestore is enabled in your Firebase project:")
          console.log("   https://console.firebase.google.com/project/aivideoeduedu/firestore")
        }
      }
    } else {
      console.log("❌ Firestore not initialized")
    }

    // Test Auth
    console.log("\n3. Testing Firebase Auth...")
    if (adminAuth) {
      try {
        // Try to get a non-existent user (should fail gracefully)
        await adminAuth.getUser('test-non-existent-user')
      } catch (authError: any) {
        if (authError.code === 'auth/user-not-found') {
          console.log("✅ Firebase Auth is working correctly")
        } else if (authError.code === 'auth/configuration-not-found') {
          console.log("❌ Firebase Auth is not enabled")
          console.log("   Please enable Authentication in your Firebase project:")
          console.log("   https://console.firebase.google.com/project/aivideoeduedu/authentication")
        } else {
          console.log("❌ Firebase Auth error:", authError.message)
        }
      }
    } else {
      console.log("❌ Firebase Auth not initialized")
    }

    // Test Storage
    console.log("\n4. Testing Firebase Storage...")
    if (adminStorage) {
      try {
        // Try to get the default bucket
        const bucket = adminStorage.bucket()
        const [exists] = await bucket.exists()
        
        if (exists) {
          console.log("✅ Firebase Storage connected!")
          console.log(`   Default bucket: ${bucket.name}`)
        } else {
          console.log("⚠️  Firebase Storage initialized but default bucket not found")
          console.log("   Please check your Firebase Storage configuration")
        }
      } catch (storageError: any) {
        console.log("❌ Firebase Storage error:", storageError.message)
      }
    } else {
      console.log("❌ Firebase Storage not initialized")
    }

  } catch (error: any) {
    console.error("\n❌ Error testing Firebase:", error.message)
    console.log("\nPlease check:")
    console.log("1. Your service account file exists at: ./aivideoeduedu-firebase-adminsdk.json")
    console.log("2. Environment variables are set correctly in .env.local")
    console.log("3. Firebase services are enabled in your project")
  }

  console.log("\n================================\n")
}

// Run the test
testFirebase().catch(console.error) 