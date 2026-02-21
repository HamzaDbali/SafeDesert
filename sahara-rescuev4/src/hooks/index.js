import { useState, useEffect, useCallback, useRef } from 'react'

export function useLiveCoords(fallback = { lat: 27.3216, lng: 14.1258, alt: 524 }) {
  const [coords, setCoords] = useState(fallback)
  const [online, setOnline] = useState(false)
  const [accuracy, setAccuracy] = useState(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      const t = setInterval(() => setCoords(c => ({
        lat: +(c.lat + (Math.random()-.5)*.0002).toFixed(5),
        lng: +(c.lng + (Math.random()-.5)*.0002).toFixed(5),
        alt: c.alt + Math.floor((Math.random()-.5)*3),
      })), 4000)
      return () => clearInterval(t)
    }

    const watchId = navigator.geolocation.watchPosition(
      pos => {
        setOnline(true)
        setAccuracy(pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null)
        setCoords({
          lat: +pos.coords.latitude.toFixed(5),
          lng: +pos.coords.longitude.toFixed(5),
          alt: pos.coords.altitude ? Math.round(pos.coords.altitude) : fallback.alt,
        })
      },
      err => { console.warn('GPS:', err.message); setOnline(false) },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return { ...coords, online, accuracy }
}

export function useSyncProgress(initial = 65, running = false) {
  const [progress, setProgress] = useState(initial)
  useEffect(() => {
    if (!running || progress >= 100) return
    const t = setInterval(() => setProgress(p => p >= 100 ? 100 : p + 0.8), 200)
    return () => clearInterval(t)
  }, [running])
  return [progress, setProgress]
}

export function useToggle(init = false) {
  const [on, setOn] = useState(init)
  return [on, useCallback(() => setOn(v => !v), [])]
}

export function useFetch(fn, deps = []) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fn()
      .then(r  => { if (!cancelled) { setData(r.data); setError(null) } })
      .catch(e => { if (!cancelled) setError(e?.response?.data?.message || 'Error') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, deps)

  const refetch = useCallback(() => {
    setLoading(true)
    fn()
      .then(r  => { setData(r.data); setError(null) })
      .catch(e => setError(e?.response?.data?.message || 'Error'))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error, refetch }
}

export function useOutsideClick(cb) {
  const ref = useRef()
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) cb() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [cb])
  return ref
}
