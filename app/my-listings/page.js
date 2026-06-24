'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function MyListings() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/post-property'); return }
      setUser(session.user)
      fetchMyListings(session.user.id)
    })
  }, [])

  async function fetchMyListings(userId) {
    const { data } = await supabase.from('listings').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    setListings(data || [])
    setLoading(false)
  }

  async function deleteListing(id) {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    setDeleting(id)
    await supabase.from('listings').delete().eq('id', id)
    setListings(prev => prev.filter(l => l.id !== id))
    setDeleting(null)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const totalClicks = listings.reduce((sum, l) => sum + (l.whatsapp_clicks || 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f6', fontFamily: 'Inter, sans-serif' }}>

      <header style={{ background: '#fff', borderBottom: '1px solid #e8e8e4', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: 22, color: '#1a1a1a', textDecoration: 'none' }}>Indo<span style={{ color: '#16a370' }}>yard</span></Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#888' }}>{user?.email}</span>
          <Link href="/post-property" style={{ background: '#16a370', color: '#fff', padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>+ Add Listing</Link>
          <button onClick={signOut} style={{ background: 'none', border: '1px solid #ddd', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', color: '#666' }}>Sign Out</button>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>

        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 20px' }}>My Listings</h1>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            ['Total Listings', listings.length, '🏭'],
            ['WhatsApp Enquiries', totalClicks, '💬'],
            ['Verified Listings', listings.filter(l => l.verified).length, '✓'],
          ].map(([label, value, icon]) => (
            <div key={label} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8e8e4', padding: '16px 20px' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a' }}>{value}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Loading your listings...</div>
        ) : listings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 12, border: '1px solid #e8e8e4' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏭</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No listings yet</div>
            <div style={{ fontSize: 14, color: '#888', marginBottom: 20 }}>Post your first property to start getting enquiries.</div>
            <Link href="/post-property" style={{ background: '#16a370', color: '#fff', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>+ Post Property</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {listings.map(l => (
              <div key={l.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e4', padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>

                {/* Thumbnail */}
                <div style={{ width: 100, height: 75, background: '#f0f0ec', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                  {l.photos && l.photos.length > 0 ? (
                    <img src={l.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 30, color: '#ccc' }}>🏭</div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1a1a' }}>{l.size_sqft?.toLocaleString()} sq ft {l.type} — {l.area}</div>
                    {l.verified && <span style={{ background: '#e8f7f1', color: '#0f6e56', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>✓ Verified</span>}
                  </div>
                  <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>📍 {l.area}, {l.city} · ₹{l.price?.toLocaleString()}/{l.price_type === 'yearly' ? 'yr' : 'mo'}</div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                    <span style={{ color: '#25d366', fontWeight: 600 }}>💬 {l.whatsapp_clicks || 0} WhatsApp enquiries</span>
                    <span style={{ color: '#999' }}>Listed {new Date(l.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <Link href={'/listings/' + l.id} style={{ padding: '7px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 12, color: '#555', textDecoration: 'none', fontWeight: 500 }}>View</Link>
                  <button onClick={() => deleteListing(l.id)} disabled={deleting === l.id} style={{ padding: '7px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, color: '#dc2626', cursor: 'pointer', fontWeight: 500 }}>
                    {deleting === l.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}