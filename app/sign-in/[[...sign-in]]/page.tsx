import React from "react"
import Link from "next/link"
import { SignIn } from "@clerk/nextjs"
import { ArrowLeft } from "lucide-react"
import "./auth.css"

export default function SignInPage() {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <Link href="/" className="auth-back-link">
          <ArrowLeft size={18} />
          Back to Home
        </Link>
        
        <div className="auth-card">
          <div className="auth-header">
            <h1>Gemark International</h1>
            <p>Welcome back! Sign in to your account</p>
          </div>
          
          <SignIn 
            appearance={{
              elements: {
                rootBox: "clerk-root-box",
                card: "clerk-card",
                headerTitle: "clerk-header-title",
                headerSubtitle: "clerk-header-subtitle",
                formButtonPrimary: "clerk-form-button",
                socialButtonsBlockButton: "clerk-social-button",
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

