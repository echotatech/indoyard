'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

const CITIES = ['Pune', 'Mumbai']
const TYPES = ['All Types', 'Warehouse', 'Factory', 'Shed', 'Showroom', 'Plot', 'Cold Storage', 'Office']
const PUNE_AREAS = ['All Areas', 'Bhosari MIDC', 'Pimpri Chinchwad', 'Chakan', 'Ranjangaon', 'Hadapsar', 'Kharadi', 'Talegaon']

export default function HomePage() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ city: 'Pune', type: '', area: '', pincode: '', size: '' })

  useEffect(() => { fetchListings() }, [filters])

  async function fetchListings() {
    setLoading(true)
    let query = supabase.from('listings').select('*').order('created_at', { ascending: false })
    if (filters.city) query = query.eq('city', filters.city)
    if (filters.type && filters.type !== 'All Types') query = query.eq('type', filters.type)
    if (filters.area && filters.area !== 'All Areas') query = query.eq('area', filters.area)
    if (filters.pincode) query = query.eq('pincode', filters.pincode)
    if (filters.size) query = query.gte('size_sqft', parseInt(filters.size))
    const { data } = await query
    setListings(data || [])
    setLoading(false)
  }

  function handleFilter(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  async function trackWhatsApp(id, number) {
    await supabase.rpc('increment_whatsapp_clicks', { listing_id: id })
    window.open('https://wa.me/91' + number + '?text=Hi, I saw your listing on Indoyard and I am interested.', '_blank')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f6', fontFamily: 'Inter, sans-serif' }}>

      <header style={{ background: '#fff', borderBottom: '1px solid #e8e8e4', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <div style={{ fontWeight: 700, fontSize: 22, color: '#1a1a1a', letterSpacing: '-0.5px' }}>
          Indo<span style={{ color: '#16a370' }}>yard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: '#666' }}>📞 +91 98765 00000</span>
          <Link href="/post-property" style={{ background: '#16a370', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>+ Post Property</Link>
        </div>
      </header>

      <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e4', padding: '16px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={filters.city} onChange={e => handleFilter('city', e.target.value)} style={selectStyle}>
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={filters.type} onChange={e => handleFilter('type', e.target.value)} style={selectStyle}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={filters.area} onChange={e => handleFilter('area', e.target.value)} style={selectStyle}>
            {PUNE_AREAS.map(a => <option key={a}>{a}</option>)}
          </select>
          <input placeholder="Pincode" value={filters.pincode} onChange={e => handleFilter('pincode', e.target.value)} style={{ ...inputStyle, width: 120 }} />
          <input placeholder="Min sq ft" type="number" value={filters.size} onChange={e => handleFilter('size', e.target.value)} style={{ ...inputStyle, width: 120 }} />
          <button onClick={fetchListings} style={{ background: '#16a370', color: '#fff', border: 'none', borderRadius: 8, padding: '0 20px', height: 40, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Search</button>
        </div>
        <div style={{ maxWidth: 1100, margin: '12px auto 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TYPES.slice(1).map(t => (
            <button key={t} onClick={() => handleFilter('type', filters.type === t ? '' : t)}
              style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid', fontSize: 13, cursor: 'pointer', fontWeight: filters.type === t ? 600 : 400, background: filters.type === t ? '#16a370' : '#fff', color: filters.type === t ? '#fff' : '#555', borderColor: filters.type === t ? '#16a370' : '#ddd' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>Featured Listings — {filters.city}</h2>
          <span style={{ fontSize: 13, color: '#888' }}>{listings.length} spaces found</span>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Loading spaces...</div>
        ) : listings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏭</div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>No listings found</div>
            <div style={{ fontSize: 14, marginTop: 6 }}>Try changing filters or <Link href="/post-property" style={{ color: '#16a370' }}>post a property</Link></div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {listings.map(l => <ListingCard key={l.id} listing={l} onWhatsApp={trackWhatsApp} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function ListingCard({ listing: l, onWhatsApp }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e4', overflow: 'hidden' }}>
      <Link href={'/listings/' + l.id} style={{ textDecoration: 'none' }}>
        <div style={{ height: 180, background: '#f0f0ec', position: 'relative', overflow: 'hidden' }}>
          {l.photos && l.photos.length > 0 ? (
            <img src={l.photos[0]} alt={l.type} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#bbb', fontSize: 48 }}>🏭</div>
          )}
          <div style={{ position: 'absolute', top: 10, right: 10, background: '#1a1a1a', color: '#fff', padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{l.type}</div>
          {l.verified && <div style={{ position: 'absolute', top: 10, left: 10, background: '#16a370', color: '#fff', padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>✓ Verified</div>}
        </div>
      </Link>
      <div style={{ padding: '14px 16px' }}>
        <Link href={'/listings/' + l.id} style={{ textDecoration: 'none' }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1a1a', marginBottom: 4 }}>{l.size_sqft?.toLocaleString()} sq ft {l.type} — {l.area}</div>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>📍 {l.area}, {l.city}</div>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#666', marginBottom: 12 }}>
            <span>📐 {l.size_sqft?.toLocaleString()} sq ft</span>
            {l.floor && <span>🏢 {l.floor}</span>}
            {l.power_supply && <span>⚡ {l.power_supply}</span>}
          </div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a1a' }}>
            ₹{l.price?.toLocaleString()}<span style={{ fontWeight: 400, fontSize: 12, color: '#888' }}>/{l.price_type === 'yearly' ? 'yr' : 'mo'}</span>
          </div>
          <button onClick={() => onWhatsApp(l.id, l.whatsapp)} style={{ background: '#25d366', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}

const selectStyle = { height: 40, border: '1px solid #ddd', borderRadius: 8, padding: '0 10px', fontSize: 14, background: '#fff', color: '#333', outline: 'none', cursor: 'pointer' }
const inputStyle = { height: 40, border: '1px solid #ddd', borderRadius: 8, padding: '0 12px', fontSize: 14, outline: 'none' }