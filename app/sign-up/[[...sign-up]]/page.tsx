import { SignUp } from "@clerk/nextjs"
import "./auth.css"

export default function SignUpPage() {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Arts Afrik</h1>
          <p>Create your account</p>
        </div>
        <SignUp />
      </div>
    </div>
  )
}
