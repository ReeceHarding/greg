/*
<ai_context>
This client page provides the signup form using Firebase Authentication with Google only.
</ai_context>
*/

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth"
import { auth } from "@/lib/firebase-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  AlertCircle,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { toast } from "@/hooks/use-toast"

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  console.log("[Signup Page] Component rendered")

  const handleGoogleSignup = async () => {
    console.log("[Signup Page] Attempting Google signup")
    setLoading(true)
    setError("")

    try {
      // Configure Google provider
      const provider = new GoogleAuthProvider()
      
      // Add scopes for better user info
      provider.addScope('profile')
      provider.addScope('email')
      
      // Force account selection
      provider.setCustomParameters({
        prompt: 'select_account'
      })
      
      // Sign in with popup
      const userCredential = await signInWithPopup(auth, provider)
      console.log(
        "[Signup Page] Google signup successful for user:",
        userCredential.user.uid
      )

      // Check if this is a new user
      const isNewUser =
        userCredential.user.metadata.creationTime ===
        userCredential.user.metadata.lastSignInTime
      console.log("[Signup Page] Is new user:", isNewUser)

      // Get the ID token with force refresh
      const idToken = await userCredential.user.getIdToken(true)
      console.log("[Signup Page] Got ID token, creating session...")

      // Send token to server to create session and profile
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ idToken, isNewUser }),
        credentials: 'include' // Ensure cookies are included
      })

      console.log("[Signup Page] Session response status:", response.status)

      if (response.ok) {
        console.log("[Signup Page] Session created successfully")
        
        // Show success toast
        toast({
          title: "Welcome to the platform!",
          description: "Your account has been created successfully.",
        })
        
        // Small delay to ensure cookie is set
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Force a hard navigation to ensure cookies are sent
        window.location.href = "/dashboard"
      } else {
        const errorData = await response.json()
        console.error("[Signup Page] Session creation failed:", errorData)
        throw new Error(errorData.error || "Failed to create session")
      }
    } catch (error: any) {
      console.error("[Signup Page] Google signup error:", error)
      
      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        setError("Sign-up cancelled. Please try again.")
      } else if (error.code === 'auth/network-request-failed') {
        setError("Network error. Please check your connection and try again.")
      } else if (error.code === 'auth/popup-blocked') {
        setError("Pop-up blocked. Please allow pop-ups for this site.")
      } else {
        setError(error.message || "Failed to sign up with Google")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-50/20 to-white" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        <Card className="relative border border-purple-100/20 bg-white/50 shadow-[0_8px_30px_rgba(147,51,234,0.12)] backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6 text-center">
            <div className="mb-6 flex justify-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex size-20 items-center justify-center rounded-2xl border-2 border-purple-600 bg-white shadow-lg"
              >
                <Sparkles className="size-8 text-purple-600" />
              </motion.div>
            </div>
            <CardTitle className="font-instrument text-3xl font-bold text-purple-600">
              Create your account
            </CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              Join thousands of developers building amazing apps
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 px-6 pb-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Alert
                  variant="destructive"
                  className="border-red-200/50 bg-red-50/50 backdrop-blur-sm"
                >
                  <AlertCircle className="size-4" />
                  <AlertDescription className="text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            <div className="space-y-4">
              <Button
                variant="outline"
                size="lg"
                className="h-12 w-full border-gray-200 bg-white hover:border-purple-300 hover:bg-gray-50 transition-all duration-200"
                onClick={handleGoogleSignup}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <svg className="mr-3 size-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Sign up with Google
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  By signing up, you agree to our{" "}
                  <Link href="/terms" className="text-purple-600 hover:underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-purple-600 hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 border-t border-purple-100/20 pt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-purple-600 underline-offset-4 transition-colors hover:text-purple-700 hover:underline"
              >
                Sign in instead
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex justify-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200/30 bg-white/50 px-4 py-2 backdrop-blur-sm">
            <div className="size-2 animate-pulse rounded-full bg-gradient-to-r from-purple-600 to-purple-400" />
            <span className="text-muted-foreground text-xs font-medium">
              Built with love for developers
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
