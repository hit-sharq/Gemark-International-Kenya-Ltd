import Link from "next/link"
import Image from "next/image"
import { cloudinaryLoader } from "@/lib/cloudinary"
import "./success.css"

export const metadata = {
  title: "Registration Submitted - ArtAfrik",
  description: "Thank you for your artisan registration application",
}

export default function ArtisanRegisterSuccessPage() {
  return (
    <div className="artisan-success-page">
      <div className="success-container">
        <div className="success-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="11" stroke="#16a34a" strokeWidth="2" />
            <path
              d="M7 12l3 3 5-6"
              stroke="#16a34a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1>Application Submitted!</h1>
        
        <p className="success-message">
          Thank you for your interest in joining ArtAfrik as an artisan. 
          Your registration application has been received and is now pending review.
        </p>

        <div className="next-steps">
          <h2>What happens next?</h2>
          <ol>
            <li>Our team will review your application within 2-3 business days</li>
            <li>You will receive an email notification once your application is approved</li>
            <li>Once approved, you can log in to your artisan dashboard</li>
            <li>Set up your shop profile and start adding your handcrafted products</li>
          </ol>
        </div>

        <div className="success-actions">
          <Link href="/gallery" className="button primary-button">
            Browse Gallery
          </Link>
          <Link href="/" className="button secondary-button">
            Return Home
          </Link>
        </div>

        <div className="success-footer">
          <p>Need help? <a href="/contact">Contact our support team</a></p>
        </div>
      </div>
    </div>
  )
}

