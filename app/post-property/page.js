'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

const CITIES = ['Pune', 'Mumbai']
const PUNE_AREAS = ['Bhosari MIDC', 'Pimpri Chinchwad', 'Chakan', 'Ranjangaon', 'Hadapsar', 'Kharadi', 'Talegaon', 'Baner', 'Other']
const TYPES = ['Warehouse', 'Factory', 'Shed', 'Showroom', 'Plot', 'Cold Storage', 'Office']
const PRICE_TYPES = ['monthly', 'yearly', 'negotiable']

export default function PostProperty() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [authData, setAuthData] = useState({ email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [step, setStep] = useState('auth')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [photos, setPhotos] = useState([])
  const [photoUrls, setPhotoUrls] = useState([])

  const [form, setForm] = useState({
    city: 'Pune', area: '', pincode: '', type: 'Warehouse',
    size_sqft: '', price: '', price_type: 'monthly',
    floor: '', power_supply: '', description: '',
    contact_name: '', whatsapp: ''
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { setUser(session.user); setStep('form') }
    })
  }, [])

  async function handleAuth() {
    setAuthLoading(true); setAuthError('')
    try {
      let result
      if (authMode === 'register') {
        result = await supabase.auth.signUp({ email: authData.email, password: authData.password })
      } else {
        result = await supabase.auth.signInWithPassword({ email: authData.email, password: authData.password })
      }
      if (result.error) { setAuthError(result.error.message); setAuthLoading(false); return }
      setUser(result.data.user)
      setStep('form')
    } catch (e) { setAuthError('Something went wrong. Please try again.') }
    setAuthLoading(false)
  }

  async function handlePhotoUpload(e) {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    setUploading(true)
    const urls = []
    for (const file of files) {
      const fileName = Date.now() + '-' + file.name.replace(/\s/g, '-')
      const { data, error } = await supabase.storage.from('listing-photos').upload(fileName, file)
      if (!error) {
        const { data: urlData } = supabase.storage.from('listing-photos').getPublicUrl(fileName)
        urls.push(urlData.publicUrl)
      }
    }
    setPhotoUrls(prev => [...prev, ...urls])
    setUploading(false)
  }

  function removePhoto(url) {
    setPhotoUrls(prev => prev.filter(u => u !== url))
  }

  async function handleSubmit() {
    if (!form.area || !form.size_sqft || !form.price || !form.contact_name || !form.whatsapp) {
      alert('Please fill all required fields'); return
    }
    setSubmitting(true)
    const { error } = await supabase.from('listings').insert([{
      ...form,
      size_sqft: parseInt(form.size_sqft),
      price: parseInt(form.price),
      photos: photoUrls,
      user_id: user.id,
      verified: false
    }])
    if (error) { alert('Error: ' + error.message); setSubmitting(false); return }
    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', background: '#f8f8f6' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>Property Listed!</h2>
        <p style={{ color: '#666', marginBottom: 24 }}>Your listing has been submitted and will be visible shortly.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/" style={{ background: '#16a370', color: '#fff', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>View Listings</Link>
          <Link href="/my-listings" style={{ background: '#fff', color: '#333', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, border: '1px solid #ddd' }}>My Listings</Link>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f6', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e8e8e4', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: 22, color: '#1a1a1a', textDecoration: 'none' }}>Indo<span style={{ color: '#16a370' }}>yard</span></Link>
        <div style={{ fontSize: 14, color: '#666' }}>Post Your Property</div>
      </header>

      <div style={{ maxWidth: 560, margin: '40px auto', padding: '0 24px' }}>

        {/* AUTH STEP */}
        {step === 'auth' && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e4', padding: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>{authMode === 'login' ? 'Sign In' : 'Create Account'}</h2>
            <p style={{ fontSize: 14, color: '#888', margin: '0 0 24px' }}>To post your property, you need an account.</p>

            {authError && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 16 }}>{authError}</div>}

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={authData.email} onChange={e => setAuthData(p => ({ ...p, email: e.target.value }))} placeholder="you@email.com" style={fieldStyle} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Password</label>
              <input type="password" value={authData.password} onChange={e => setAuthData(p => ({ ...p, password: e.target.value }))} placeholder="Minimum 6 characters" style={fieldStyle} />
            </div>

            <button onClick={handleAuth} disabled={authLoading} style={{ width: '100%', background: '#16a370', color: '#fff', border: 'none', borderRadius: 8, padding: 14, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign In & Continue' : 'Create Account & Continue'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#666' }}>
              {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError('') }} style={{ background: 'none', border: 'none', color: '#16a370', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                {authMode === 'login' ? 'Register' : 'Sign In'}
              </button>
            </div>
          </div>
        )}

        {/* FORM STEP */}
        {step === 'form' && (
          <div>
            <div style={{ background: '#e8f7f1', border: '1px solid #b6e4d4', borderRadius: 8, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: '#0f6e56' }}>
              ✓ Logged in as {user?.email} · <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} style={{ background: 'none', border: 'none', color: '#16a370', cursor: 'pointer', fontSize: 13, padding: 0 }}>Sign out</button>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e4', padding: 32 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 24px' }}>Property Details</h2>

              <Row>
                <Field label="City *">
                  <select value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} style={fieldStyle}>
                    {CITIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Space Type *">
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={fieldStyle}>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
              </Row>

              <Row>
                <Field label="Area / Locality *">
                  <select value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} style={fieldStyle}>
                    <option value="">Select area</option>
                    {PUNE_AREAS.map(a => <option key={a}>{a}</option>)}
                  </select>
                </Field>
                <Field label="Pincode">
                  <input value={form.pincode} onChange={e => setForm(p => ({ ...p, pincode: e.target.value }))} placeholder="411019" style={fieldStyle} />
                </Field>
              </Row>

              <Row>
                <Field label="Size (sq ft) *">
                  <input type="number" value={form.size_sqft} onChange={e => setForm(p => ({ ...p, size_sqft: e.target.value }))} placeholder="5000" style={fieldStyle} />
                </Field>
                <Field label="Floor">
                  <input value={form.floor} onChange={e => setForm(p => ({ ...p, floor: e.target.value }))} placeholder="Ground / 1st / 2nd" style={fieldStyle} />
                </Field>
              </Row>

              <Row>
                <Field label="Price (₹) *">
                  <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="45000" style={fieldStyle} />
                </Field>
                <Field label="Price Type *">
                  <select value={form.price_type} onChange={e => setForm(p => ({ ...p, price_type: e.target.value }))} style={fieldStyle}>
                    {PRICE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
              </Row>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Power Supply</label>
                <input value={form.power_supply} onChange={e => setForm(p => ({ ...p, power_supply: e.target.value }))} placeholder="e.g. 3-phase, 100 KVA" style={fieldStyle} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Tell potential tenants about the space, access, amenities..." rows={4} style={{ ...fieldStyle, resize: 'vertical' }} />
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 600, margin: '24px 0 16px', paddingTop: 16, borderTop: '1px solid #f0f0ec' }}>Photos</h3>
              <div style={{ border: '2px dashed #ddd', borderRadius: 8, padding: 20, textAlign: 'center', marginBottom: 16 }}>
                <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} id="photo-upload" style={{ display: 'none' }} />
                <label htmlFor="photo-upload" style={{ cursor: 'pointer', color: '#16a370', fontSize: 14, fontWeight: 600 }}>
                  {uploading ? '⏳ Uploading...' : '📷 Click to upload photos'}
                </label>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>Multiple files allowed. JPG, PNG.</div>
              </div>
              {photoUrls.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {photoUrls.map((url, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={url} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                      <button onClick={() => removePhoto(url)} style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              <h3 style={{ fontSize: 16, fontWeight: 600, margin: '24px 0 16px', paddingTop: 16, borderTop: '1px solid #f0f0ec' }}>Contact Details</h3>
              <Row>
                <Field label="Your Name *">
                  <input value={form.contact_name} onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))} placeholder="Rajesh Kumar" style={fieldStyle} />
                </Field>
                <Field label="WhatsApp Number *">
                  <input value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} placeholder="9876500000" style={fieldStyle} />
                </Field>
              </Row>

              <button onClick={handleSubmit} disabled={submitting} style={{ width: '100%', background: '#16a370', color: '#fff', border: 'none', borderRadius: 8, padding: 14, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
                {submitting ? 'Submitting...' : '🏭 Submit Listing'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>{children}</div>
}
function Field({ label, children }) {
  return <div><label style={labelStyle}>{label}</label>{children}</div>
}
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }
const fieldStyle = { width: '100%', height: 40, border: '1px solid #ddd', borderRadius: 8, padding: '0 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }
