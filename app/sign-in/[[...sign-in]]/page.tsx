import React from "react"
import { SignIn } from "@clerk/nextjs"
import "./auth.css"

export default function SignInPage() {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Arts Afrik</h1>
          <p>Sign in to your account</p>
        </div>
        <SignIn />
      </div>
    </div>
  )
}
