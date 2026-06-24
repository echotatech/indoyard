'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'

export default function ListingDetail() {
  const { id } = useParams()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [photoIndex, setPhotoIndex] = useState(0)

  useEffect(() => {
    async function fetchListing() {
      const { data } = await supabase.from('listings').select('*').eq('id', id).single()
      setListing(data)
      setLoading(false)
    }
    fetchListing()
  }, [id])

  async function handleWhatsApp() {
    await supabase.rpc('increment_whatsapp_clicks', { listing_id: id })
    window.open('https://wa.me/91' + listing.whatsapp + '?text=Hi ' + listing.contact_name + ', I saw your ' + listing.type + ' listing on Indoyard (' + listing.area + ', ' + listing.city + ') and I am interested. Can you share more details?', '_blank')
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#888', fontFamily: 'Inter, sans-serif' }}>Loading...</div>
  if (!listing) return <div style={{ padding: 60, textAlign: 'center', color: '#888', fontFamily: 'Inter, sans-serif' }}>Listing not found. <Link href="/">Go back</Link></div>

  const photos = listing.photos && listing.photos.length > 0 ? listing.photos : []

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f6', fontFamily: 'Inter, sans-serif' }}>

      <header style={{ background: '#fff', borderBottom: '1px solid #e8e8e4', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: 22, color: '#1a1a1a', textDecoration: 'none', letterSpacing: '-0.5px' }}>
          Indo<span style={{ color: '#16a370' }}>yard</span>
        </Link>
        <Link href="/" style={{ fontSize: 13, color: '#555', textDecoration: 'none' }}>← Back to listings</Link>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>

        {/* Photos */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e4', overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ height: 400, background: '#f0f0ec', position: 'relative' }}>
            {photos.length > 0 ? (
              <img src={photos[photoIndex]} alt="listing" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 80, color: '#ccc' }}>🏭</div>
            )}
            {listing.verified && <div style={{ position: 'absolute', top: 16, left: 16, background: '#16a370', color: '#fff', padding: '5px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>✓ Verified Listing</div>}
            <div style={{ position: 'absolute', top: 16, right: 16, background: '#1a1a1a', color: '#fff', padding: '5px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{listing.type}</div>
          </div>
          {photos.length > 1 && (
            <div style={{ display: 'flex', gap: 8, padding: 12, overflowX: 'auto' }}>
              {photos.map((p, i) => (
                <img key={i} src={p} onClick={() => setPhotoIndex(i)} alt=""
                  style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6, cursor: 'pointer', border: i === photoIndex ? '2px solid #16a370' : '2px solid transparent', opacity: i === photoIndex ? 1 : 0.7 }} />
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>

          {/* Left — details */}
          <div>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e4', padding: 24, marginBottom: 16 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>
                {listing.size_sqft?.toLocaleString()} sq ft {listing.type}
              </h1>
              <div style={{ fontSize: 15, color: '#666', marginBottom: 20 }}>📍 {listing.area}, {listing.city} {listing.pincode && '— ' + listing.pincode}</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  ['Size', listing.size_sqft?.toLocaleString() + ' sq ft'],
                  ['Type', listing.type],
                  ['Floor', listing.floor || '—'],
                  ['Power', listing.power_supply || '—'],
                  ['City', listing.city],
                  ['Area', listing.area],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: '#f8f8f6', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: '#999', fontWeight: 500, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{value}</div>
                  </div>
                ))}
              </div>

              {listing.description && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>Description</div>
                  <div style={{ fontSize: 14, color: '#555', lineHeight: 1.7 }}>{listing.description}</div>
                </div>
              )}
            </div>
          </div>

          {/* Right — price + contact */}
          <div>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e4', padding: 24, position: 'sticky', top: 20 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 }}>
                ₹{listing.price?.toLocaleString()}
              </div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>per {listing.price_type === 'yearly' ? 'year' : 'month'} {listing.price_type === 'negotiable' && '(negotiable)'}</div>

              <button onClick={handleWhatsApp} style={{ width: '100%', background: '#25d366', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span>💬</span> Chat on WhatsApp
              </button>

              <div style={{ border: '1px solid #e8e8e4', borderRadius: 10, padding: 16, marginTop: 8 }}>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Listed by</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{listing.contact_name}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                  Listed {new Date(listing.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}