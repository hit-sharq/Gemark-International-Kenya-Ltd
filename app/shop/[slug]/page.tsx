
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { prisma } from "lib/prisma"
import { cloudinaryLoader } from "lib/cloudinary"
import MainLayout from "@/components/MainLayout"
import { ArrowLeft } from "lucide-react"
import "./shop.css"

interface ShopPageProps {
  params: Promise<{ slug: string }>
}

async function getShopData(slug: string) {
  const artisan = await prisma.artisan.findFirst({
    where: {
      shopSlug: slug,
      status: "APPROVED",
    },
    include: {
      artListings: {
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { artListings: true },
      },
    },
  })

  return artisan
}

export async function generateMetadata({ params }: ShopPageProps) {
  const { slug } = await params
  const artisan = await getShopData(slug)

  if (!artisan) {
    return {
      title: "Shop Not Found | ArtAfrik",
    }
  }

  return {
    title: `${artisan.shopName || artisan.fullName} | ArtAfrik`,
    description: artisan.shopBio?.substring(0, 160) || `Shop of ${artisan.fullName}, a ${artisan.specialty} artisan from ${artisan.region}`,
  }
}

export default async function ArtisanShopPage({ params }: ShopPageProps) {
  const { slug } = await params
  const artisan = await getShopData(slug)

  if (!artisan) {
    notFound()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  return (
    <MainLayout>
      <div className="artisan-shop-page">
        {/* Back Button */}
        <div className="shop-back-button">
          <Link href="/shop" className="back-link">
            <ArrowLeft size={20} />
            Back to All Shops
          </Link>
        </div>

        {/* Shop Header */}
        <div className="shop-header">
          {artisan.shopBanner && (
            <div className="shop-banner">
              <Image
                src={artisan.shopBanner}
                alt={`${artisan.shopName || artisan.fullName} banner`}
                fill
                style={{ objectFit: "cover" }}
                loader={cloudinaryLoader}
                priority
              />
            </div>
          )}
          <div className="shop-header-content">
            <div className="shop-logo-container">
              {artisan.shopLogo ? (
                <Image
                  src={artisan.shopLogo}
                  alt={`${artisan.shopName || artisan.fullName} logo`}
                  width={120}
                  height={120}
                  className="shop-logo"
                  loader={cloudinaryLoader}
                />
              ) : (
                <div className="shop-logo-placeholder">
                  {artisan.fullName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="shop-info">
              <h1>{artisan.shopName || artisan.fullName}</h1>
              <div className="shop-meta">
                <span className="location">
                  📍 {artisan.location || artisan.region}
                </span>
                <span className="specialty">
                  🎨 {artisan.specialty}
                </span>
                <span className="product-count">
                  📦 {artisan._count.artListings} products
                </span>
              </div>
              {artisan.shopBio && (
                <p className="shop-bio">{artisan.shopBio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="shop-content">
          <section className="products-section">
            <h2>
              {artisan.shopName || artisan.fullName}&apos;s Products
              <span className="product-count-badge">
                {artisan._count.artListings} items
              </span>
            </h2>

            {artisan.artListings.length === 0 ? (
              <div className="empty-products">
                <p>No products available yet.</p>
                <p>Check back soon for new handcrafts!</p>
              </div>
            ) : (
              <div className="products-grid">
                {artisan.artListings.map((product) => (
                  <Link
                    key={product.id}
                    href={`/gallery/${product.id}`}
                    className="product-card"
                  >
                    <div className="product-image">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0]}
                          alt={product.title}
                          fill
                          style={{ objectFit: "cover" }}
                          loader={cloudinaryLoader}
                        />
                      ) : (
                        <div className="placeholder-image">No Image</div>
                      )}
                      {product.featured && (
                        <span className="featured-badge">Featured</span>
                      )}
                    </div>
                    <div className="product-info">
                      <h3>{product.title}</h3>
                      <p className="product-price">{formatPrice(product.price)}</p>
                      <p className="product-region">📍 {product.region}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </MainLayout>
  )
}

