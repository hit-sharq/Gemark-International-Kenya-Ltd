import Link from "next/link"
import "./Footer.css"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Gemark International</h3>
            <p>
              Your premier destination for exquisite African woodwork and art. We specialize in black wood ebony carvings,
              rose wood art, traditional masks, antiques, gemstones, and authentic African jewellery sourced from Kenya.
            </p>
            <div className="social-links">
              <a
                href="https://instagram.com/gemark_kenya"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
              >
                <i className="fab fa-instagram"></i>
              </a>
              <a href="https://wa.me/+254727205718" target="_blank" rel="noopener noreferrer" className="social-link">
                <i className="fab fa-whatsapp"></i>
              </a>
              <a
                href="https://facebook.com/gemarkkenya"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
              >
                <i className="fab fa-facebook-f"></i>
              </a>
            </div>
          </div>

          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/gallery">Gallery</Link>
              </li>
              <li>
                <Link href="/about">About Us</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Our Collections</h3>
            <ul className="footer-links">
              <li>
                <Link href="/gallery?category=Ebony">Black Ebony Carvings</Link>
              </li>
              <li>
                <Link href="/gallery?category=Rosewood">Rose Wood Art</Link>
              </li>
              <li>
                <Link href="/gallery?category=Masks">Traditional Masks</Link>
              </li>
              <li>
                <Link href="/gallery?category=Antiques">Antiques</Link>
              </li>
              <li>
                <Link href="/gallery?category=Gemstones">Gemstones</Link>
              </li>
              <li>
                <Link href="/gallery?category=Jewellery">African Jewellery</Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Contact Us</h3>
            <p>Two Rivers Mall, Limuru Road</p>
            <p>Nairobi, Kenya</p>
            <p>Phone: +254 727 205 718</p>
            <p>Email: info@gemark.co.ke</p>
            <p>Hours: Mon - Sat, 10am - 8pm</p>
            <p>Sun, 11am - 6pm</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} Gemark International Kenya Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
