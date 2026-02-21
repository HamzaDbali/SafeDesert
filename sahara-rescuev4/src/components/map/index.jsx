import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export const TYPE_META = {
  water:  { color:'#1A5FA0', bg:'rgba(26,95,160,.13)',  icon:'💧', label:'Water'   },
  safe:   { color:'#2A7A3B', bg:'rgba(42,122,59,.13)',  icon:'🛡️', label:'Safe'    },
  danger: { color:'#C8291F', bg:'rgba(200,41,31,.13)',  icon:'⚠️', label:'Danger'  },
  camp:   { color:'#7B3F9E', bg:'rgba(123,63,158,.13)', icon:'⛺', label:'Camp'    },
  food:   { color:'#C47A1E', bg:'rgba(196,122,30,.13)', icon:'🍖', label:'Food'    },
}
const DEFAULT_META = { color:'#9A8060', bg:'rgba(154,128,96,.13)', icon:'📍', label:'Point' }

function makePin(type) {
  const m = TYPE_META[type] || DEFAULT_META
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;flex-direction:column;align-items:center;width:44px">
      <div style="width:44px;height:44px;border-radius:50% 50% 50% 50%/58% 58% 42% 42%;
        background:${m.color};border:3px solid #fff;display:flex;align-items:center;
        justify-content:center;font-size:19px;
        box-shadow:0 6px 20px ${m.color}55,0 2px 6px rgba(0,0,0,.3);">${m.icon}</div>
      <div style="width:0;height:0;border-left:5px solid transparent;
        border-right:5px solid transparent;border-top:8px solid ${m.color};margin-top:-1px;"></div>
    </div>`,
    iconSize:[44,60], iconAnchor:[22,60], popupAnchor:[0,-62],
  })
}

const USER_ICON = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:26px;height:26px;display:flex;align-items:center;justify-content:center">
    <div style="position:absolute;width:56px;height:56px;border-radius:50%;background:rgba(232,96,28,.1);top:50%;left:50%;transform:translate(-50%,-50%);animation:ping 2.4s ease-out infinite"></div>
    <div style="position:absolute;width:38px;height:38px;border-radius:50%;background:rgba(232,96,28,.15);top:50%;left:50%;transform:translate(-50%,-50%);animation:ping 2.4s ease-out .5s infinite"></div>
    <div style="width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#F4874A,#E8601C);border:3px solid #fff;box-shadow:0 2px 16px rgba(232,96,28,.8);z-index:2"></div>
  </div>`,
  iconSize:[26,26], iconAnchor:[13,13],
})

const DROP_ICON = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;position:relative">
    <div style="position:absolute;inset:-6px;border-radius:50%;border:2px dashed rgba(232,96,28,.6);animation:spin 4s linear infinite"></div>
    <div style="width:14px;height:14px;background:#E8601C;border-radius:50%;border:2px solid white;box-shadow:0 0 12px rgba(232,96,28,.9)"></div>
  </div>`,
  iconSize:[28,28], iconAnchor:[14,14],
})

const TILES = {
  map:       { url:'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',                                                attr:'© OSM'  },
  satellite: { url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',    attr:'© Esri' },
  terrain:   { url:'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',                                                 attr:'© OTM'  },
}

// ─── Main LeafletMap ──────────────────────────────────────────────────────────
export function LeafletMap({ coords, pins = [], onPinClick, onMapClick, selectedCoords, mapRef: externalRef }) {
  const containerRef = useRef(null)
  const instanceRef  = useRef(null)   // the L.Map instance
  const userMarker   = useRef(null)
  const dropMarker   = useRef(null)
  const pinMarkers   = useRef([])
  const tileLayer    = useRef(null)
  const coordsRef    = useRef(coords) // always-fresh coords for callbacks
  const [activeLayer, setActiveLayer] = useState('map')

  // Keep coordsRef fresh without re-running effects
  useEffect(() => { coordsRef.current = coords }, [coords])

  // ── Initialize map once ───────────────────────────────────────────────────
  useEffect(() => {
    if (instanceRef.current) return

    const map = L.map(containerRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 14,
      zoomControl: false,
      tap: false,
    })

    tileLayer.current = L.tileLayer(TILES.map.url, { attribution: TILES.map.attr, maxZoom: 19 }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map)

    userMarker.current = L.marker([coords.lat, coords.lng], { icon: USER_ICON, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup('<b style="font-family:Sora,sans-serif;font-size:13px">📍 Your Position</b>')

    map.on('click', (e) => {
      const p = { lat: +e.latlng.lat.toFixed(5), lng: +e.latlng.lng.toFixed(5) }
      if (onMapClick) onMapClick(p)
    })

    instanceRef.current = map

    // Expose imperative API immediately
    if (externalRef) {
      externalRef.current = {
        flyTo:       (lat, lng, zoom = 16) => map.flyTo([lat, lng], zoom, { duration: 0.8 }),
        recenter:    ()                    => map.flyTo([coordsRef.current.lat, coordsRef.current.lng], 15, { duration: 1 }),
        switchLayer: (key) => {
          if (tileLayer.current) map.removeLayer(tileLayer.current)
          tileLayer.current = L.tileLayer(TILES[key].url, { attribution: TILES[key].attr, maxZoom: 19 }).addTo(map)
          setActiveLayer(key)
        },
      }
    }

    return () => {
      map.remove()
      instanceRef.current = null
    }
  }, []) // run once only — coords available at mount

  // ── Keep externalRef.recenter fresh (coords change) ───────────────────────
  useEffect(() => {
    if (!externalRef || !instanceRef.current) return
    const map = instanceRef.current
    externalRef.current = {
      ...externalRef.current,
      flyTo:    (lat, lng, zoom = 16) => map.flyTo([lat, lng], zoom, { duration: 0.8 }),
      recenter: ()                    => map.flyTo([coords.lat, coords.lng], 15, { duration: 1 }),
      switchLayer: (key) => {
        if (tileLayer.current) map.removeLayer(tileLayer.current)
        tileLayer.current = L.tileLayer(TILES[key].url, { attribution: TILES[key].attr, maxZoom: 19 }).addTo(map)
        setActiveLayer(key)
      },
    }
  }) // runs every render — intentional, cheap

  // ── Move user marker ───────────────────────────────────────────────────────
  useEffect(() => {
    if (userMarker.current) userMarker.current.setLatLng([coords.lat, coords.lng])
  }, [coords.lat, coords.lng])

  // ── Fly to user on first real GPS fix ─────────────────────────────────────
  const hasFlewToUser = useRef(false)
  useEffect(() => {
    if (coords.online && !hasFlewToUser.current && instanceRef.current) {
      hasFlewToUser.current = true
      instanceRef.current.flyTo([coords.lat, coords.lng], 15, { duration: 1.2 })
    }
  }, [coords.online, coords.lat, coords.lng])

  // ── Drop/crosshair marker ─────────────────────────────────────────────────
  useEffect(() => {
    if (!instanceRef.current) return
    if (dropMarker.current) { dropMarker.current.remove(); dropMarker.current = null }
    if (selectedCoords) {
      dropMarker.current = L.marker([selectedCoords.lat, selectedCoords.lng], {
        icon: DROP_ICON, zIndexOffset: 999,
      })
        .addTo(instanceRef.current)
        .bindPopup(
          `<span style="font-family:JetBrains Mono,monospace;font-size:11px;color:#1A1208">
            ${selectedCoords.lat}° N<br/>${selectedCoords.lng}° E
          </span>`
        )
        .openPopup()
    }
  }, [selectedCoords])

  // ── Render pins ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!instanceRef.current) return
    pinMarkers.current.forEach(m => m.remove())
    pinMarkers.current = []

    pins.forEach(pin => {
      if (pin.lat == null || pin.lng == null) return
      const meta = TYPE_META[pin.type] || DEFAULT_META
      const marker = L.marker([pin.lat, pin.lng], { icon: makePin(pin.type) })
        .addTo(instanceRef.current)
        .bindPopup(`
          <div style="font-family:Sora,sans-serif;min-width:170px;padding:2px 0">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
              <span style="font-size:18px">${meta.icon}</span>
              <div>
                <b style="font-size:13px;color:#1A1208;display:block">${pin.label}</b>
                <span style="font-size:9px;color:#9A8060;font-family:JetBrains Mono,monospace">
                  ${pin.lat.toFixed(4)}°N · ${pin.lng.toFixed(4)}°E
                </span>
              </div>
            </div>
            ${pin.description ? `<p style="font-size:12px;color:#6A5540;margin:0 0 6px;line-height:1.4">${pin.description}</p>` : ''}
            ${pin.verifiedCount ? `<div style="font-size:10px;color:#2A7A3B;font-weight:700">✓ Verified ${pin.verifiedCount}×</div>` : ''}
          </div>`, { maxWidth: 220 })

      marker.on('click', () => onPinClick && onPinClick(pin))
      pinMarkers.current.push(marker)
    })
  }, [pins, onPinClick])

  // ── Layer switcher UI ─────────────────────────────────────────────────────
  const handleLayer = (key) => {
    if (!instanceRef.current) return
    if (tileLayer.current) instanceRef.current.removeLayer(tileLayer.current)
    tileLayer.current = L.tileLayer(TILES[key].url, { attribution: TILES[key].attr, maxZoom: 19 }).addTo(instanceRef.current)
    setActiveLayer(key)
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Layer pills — bottom-right, above Leaflet zoom */}
      <div style={{ position:'absolute', bottom:80, right:10, zIndex:401, display:'flex', flexDirection:'column', gap:4 }}>
        {Object.entries(TILES).map(([key]) => (
          <button key={key} onClick={() => handleLayer(key)} style={{
            padding:'5px 12px', borderRadius:20, fontSize:9, fontWeight:700,
            letterSpacing:'.07em', border:'none', cursor:'pointer', fontFamily:'var(--font-b)',
            background: activeLayer === key ? '#E8601C' : 'rgba(15,10,4,.82)',
            color: activeLayer === key ? '#fff' : 'rgba(255,255,255,.55)',
            backdropFilter: 'blur(8px)',
            boxShadow: activeLayer === key ? '0 2px 12px rgba(232,96,28,.5)' : '0 2px 8px rgba(0,0,0,.3)',
            transition: 'all .2s',
          }}>
            {key.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Mini pick-map for report form ───────────────────────────────────────────
export function MiniPickMap({ coords, onPick, picked }) {
  const ref    = useRef(null)
  const mapRef = useRef(null)
  const mRef   = useRef(null)

  useEffect(() => {
    if (mapRef.current) return

    const map = L.map(ref.current, {
      center: [coords.lat, coords.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
      tap: false,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
    L.control.zoom({ position: 'topright' }).addTo(map)
    L.marker([coords.lat, coords.lng], { icon: USER_ICON, zIndexOffset: 100 }).addTo(map)

    map.on('click', (e) => {
      const p = { lat: +e.latlng.lat.toFixed(5), lng: +e.latlng.lng.toFixed(5) }
      if (mRef.current) { mRef.current.remove(); mRef.current = null }
      mRef.current = L.marker([p.lat, p.lng], { icon: DROP_ICON }).addTo(map)
      onPick && onPick(p)
    })

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return
    if (!picked && mRef.current) { mRef.current.remove(); mRef.current = null }
  }, [picked])

  return <div ref={ref} style={{ width: '100%', height: 180, borderRadius: 12, overflow: 'hidden' }} />
}

// kept for import compat
export function MapPin() { return null }
export function TopoBackground() { return null }
