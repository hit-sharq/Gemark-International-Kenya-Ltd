import MainLayout from "components/MainLayout"
import "./about.css"
import { getTeamMembers } from "../actions/team-actions"
import TeamMemberImage from "components/TeamMemberImage"
import { prisma } from "lib/prisma"

type GalleryImage = {
  image: string
  title?: string
}

function selectImageByDay(images: GalleryImage[]) {
  if (!images || images.length === 0) return null
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % images.length
  return images[dayIndex]
}

export default async function About() {
  const { teamMembers = [] } = await getTeamMembers()
  let artListings: Array<{
    id: string
    title: string
    description: string
    price: number
    category: {
      id: string
      name: string
      slug: string
    }
    material: string | null
    region: string
    size: string
    images: string[]
    featured: boolean
    createdAt: Date
    updatedAt: Date
  }> = []
  try {
    artListings = await prisma.artListing.findMany({
      include: {
        category: true,
      },
    })
  } catch (error) {
    console.error("Error fetching art listings:", error)
  }
  // Flatten all images from all art listings into a single array
  const allImages: GalleryImage[] = []
  artListings.forEach((listing) => {
    if (listing.images && listing.images.length > 0) {
      listing.images.forEach((img: string) => {
        allImages.push({ image: img, title: listing.title })
      })
    }
  })
  const selectedImage = selectImageByDay(allImages)

  return (
    <MainLayout>
      <div className="about-page">
        <div className="container">
          <h1 className="page-title">About Gemark International</h1>

          <section className="mission-section">
            <div className="mission-content">
              <div className="mission-text">
                <h2>Our Story</h2>
                <p className="subtitle">Preserving African Heritage Through Fine Woodwork</p>
                <p>
                  Welcome to Gemark International Kenya Ltd, your premier destination for authentic African woodwork and art
                  in the heart of Nairobi. Located at the prestigious Two Rivers Mall on Limuru Road, we specialize in bringing
                  the finest handcrafted treasures from Kenya's master artisans to collectors and enthusiasts worldwide.
                </p>
                <p>
                  Our collection features exquisite black wood ebony carvings, rosewood masterpieces, traditional masks,
                  rare antiques, stunning gemstones, and authentic African jewellery. Each piece in our carefully curated
                  selection represents generations of artistic tradition and cultural heritage.
                </p>
                <p>
                  At Gemark International, we believe that every artwork tells a story – of the artisan who crafted it,
                  the culture that inspired it, and the traditions that shaped it. Our mission is to preserve and share
                  these stories with the world while supporting local artisan communities.
                </p>

                <h3>What We Offer</h3>
                <ul>
                  <li><strong>Black Wood Ebony Carvings:</strong> Exquisite sculptures and decorative pieces carved from premium African ebony</li>
                  <li><strong>Rose Wood Art:</strong> Beautiful carvings and artworks crafted from fragrant and visually stunning African rosewood</li>
                  <li><strong>Traditional Masks:</strong> Authentic ceremonial and decorative masks from various Kenyan and East African cultures</li>
                  <li><strong>Antiques:</strong> Rare and valuable historical pieces collected over generations</li>
                  <li><strong>Gemstones:</strong> Exquisite African gemstones including tsavorite, tourmaline, and other precious stones</li>
                  <li><strong>African Jewellery:</strong> Handcrafted traditional and contemporary jewellery pieces</li>
                </ul>

                <h3>Our Commitment</h3>
                <p>
                  We are committed to authenticity, quality, and fair trade. Every piece in our collection is
                  personally selected for its craftsmanship, cultural significance, and artistic merit. By
                  choosing Gemark International, you're not just acquiring a beautiful piece – you're supporting
                  sustainable livelihoods for talented artisans and helping to preserve cultural heritage.
                </p>

                <h3>Visit Us</h3>
                <p>
                  Located in the upscale Two Rivers Mall, our gallery offers a comfortable and elegant environment
                  where you can explore our collection at your leisure. Whether you're a collector, enthusiast,
                  or looking for a meaningful gift, we invite you to discover the beauty and artistry of Africa
                  at Gemark International.
                </p>
              </div>
              <div className="mission-image">
                <TeamMemberImage
                  src="/images/_ (24).jpeg"
                  alt="Gemark International Gallery"
                  width={600}
                  height={400}
                  style={{ objectFit: "contain" }}
                />
              </div>
              <div className="sourcing-text">
                <h2>Our Craftsmanship</h2>
                <p>
                  The artisans we work with are masters of their craft, having inherited skills passed down through
                  generations. From the dense, dark beauty of African ebony to the warm tones of rosewood, each
                  material is carefully selected for its quality and character.
                </p>
                <p>
                  Our wood carvings are created using traditional techniques that have been refined over centuries.
                  Each piece undergoes meticulous hand-carving, sanding, and finishing to bring out the natural
                  beauty of the wood and ensure longevity.
                </p>
                <p>
                  For our masks and traditional art pieces, we work directly with artisan communities across Kenya
                  and East Africa, building relationships based on mutual respect and fair trade principles.
                  We ensure that every piece is authentic and that artisans receive fair compensation for their work.
                </p>
                <p>
                  Our gemstone collection features ethically sourced stones from African mines, carefully cut and
                  polished by skilled lapidaries. Each gemstone is individually selected for its quality and uniqueness.
                </p>
              </div>
              <div className="mission-image">
                <TeamMemberImage
                  src="/images/_ (25).jpeg"
                  alt="African Artisan Craftsmanship"
                  width={600}
                  height={400}
                  style={{ objectFit: "contain" }}
                />
              </div>
            </div>
          </section>

          <section className="team-section">
            <h2>Our Team</h2>
            <div className="team-grid">
            {teamMembers.length > 0 ? (
                teamMembers.map((member) => (
                  <div className="team-member" key={member.id}>
                    <div className="member-image">
                      <img 
                        src={member.image || "/placeholder.svg"} 
                        alt={member.name}
                        className="member-img"
                      />
                    </div>
                    <h3>{member.name}</h3>
                    <p className="member-title">{member.title}</p>
                  </div>
                ))
              ) : (
                <div className="no-team-members">
                  <p>Our dedicated team is here to help you discover the perfect piece. Visit us at Two Rivers Mall to meet our staff and explore our collection.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  )
}
