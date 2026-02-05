import { prisma } from "lib/prisma"
import { cloudinaryLoader } from "lib/cloudinary"
import Image from "next/image"
import Link from "next/link"
import MainLayout from "@/components/MainLayout"
import "./shops.css"

export const metadata = {
  title: "Shops | ArtAfrik",
  description: "Browse shops from talented artisans across Africa",
}

async function getApprovedArtisans() {
  const artisans = await prisma.artisan.findMany({
    where: {
      status: "APPROVED",
    },
    include: {
      _count: {
        select: { artListings: true },
      },
    },
    orderBy: {
      approvedAt: "desc",
    },
  })

  return artisans
}

export default async function ShopsPage() {
  const artisans = await getApprovedArtisans()

  return (
    <MainLayout>
      <div className="shops-page">
        <header className="shops-header">
          <div className="header-content">
            <h1>Artisan Shops</h1>
            <p>Discover unique handcrafts from talented artisans across Africa</p>
          </div>
        </header>

        <main className="shops-content">
          {artisans.length === 0 ? (
            <div className="no-shops">
              <div className="no-shops-icon">🏪</div>
              <h2>No Shops Yet</h2>
              <p>Our artisan community is growing! Check back soon for new shops.</p>
              <Link href="/gallery" className="browse-button">
                Browse Artworks
              </Link>
            </div>
          ) : (
            <>
              <div className="shops-count">
                <span>{artisans.length} {artisans.length === 1 ? "Shop" : "Shops"}</span>
              </div>

              <div className="shops-grid">
                {artisans.map((artisan) => (
                  <Link
                    key={artisan.id}
                    href={`/shop/${artisan.shopSlug}`}
                    className="shop-card"
                  >
                    <div className="shop-card-banner">
                      {artisan.shopBanner ? (
                        <Image
                          src={artisan.shopBanner}
                          alt={`${artisan.shopName || artisan.fullName} banner`}
                          fill
                          style={{ objectFit: "cover" }}
                          loader={cloudinaryLoader}
                        />
                      ) : (
                        <div className="banner-placeholder">
                          <span>🎨</span>
                        </div>
                      )}
                    </div>

                    <div className="shop-card-content">
                      <div className="shop-card-logo">
                        {artisan.shopLogo ? (
                          <Image
                            src={artisan.shopLogo}
                            alt={`${artisan.shopName || artisan.fullName} logo`}
                            width={80}
                            height={80}
                            loader={cloudinaryLoader}
                          />
                        ) : (
                          <div className="logo-placeholder">
                            {artisan.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="shop-card-info">
                        <h2>{artisan.shopName || artisan.fullName}</h2>
                        
                        <div className="shop-card-meta">
                          <span className="artisan-name">by {artisan.fullName}</span>
                          <span className="separator">•</span>
                          <span className="location">
                            📍 {artisan.location || artisan.region}
                          </span>
                        </div>

                        <p className="shop-card-bio">
                          {artisan.shopBio
                            ? artisan.shopBio.substring(0, 100) + "..."
                            : `Specializing in ${artisan.specialty}`}
                        </p>

                        <div className="shop-card-footer">
                          <span className="specialty-badge">
                            {artisan.specialty}
                          </span>
                          <span className="products-count">
                            📦 {artisan._count.artListings} {artisan._count.artListings === 1 ? "product" : "products"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shop-card-action">
                      <span>Visit Shop</span>
                      <span className="arrow">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </main>

        <section className="become-artisan-cta">
          <div className="cta-content">
            <h2>Are you an artisan?</h2>
            <p>Join our marketplace and share your handcrafts with customers worldwide</p>
            <Link href="/artisan/register" className="cta-button">
              Apply to Sell
            </Link>
          </div>
        </section>
      </div>
    </MainLayout>
  )
}

