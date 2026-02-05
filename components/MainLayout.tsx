import type { ReactNode } from "react"
import Header from "./Header"
import Footer from "./Footer"
import BackToTop from "./BackToTop"
import CartSidebar from "./CartSidebar"
import "./MainLayout.css"

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <BackToTop />
      <CartSidebar />
    </>
  )
}
