'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, Sparkles, CheckCircle, XCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { useGrantStore } from '@/store/grantStore';
import { detectStateFromAddress, detectZipFromAddress } from '@/lib/fortifiedGrants';
import AddressAutocomplete from './AddressAutocomplete';

const PRIMARY = '#166534';
const ACCENT  = '#16a34a';

const STATES_WITH_PROGRAMS = ['AL', 'NC', 'FL', 'LA', 'SC', 'OK', 'AR', 'TX', 'MS'];

export default function AddressStep() {
  const {
    inputAddress, setInputAddress,
    setGeocode, setSatelliteUrl, setAddressConfirmed,
    setStep, geocode, satelliteUrl, addressConfirmed,
  } = useGrantStore();

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState('');
  const [teaserState, setTeaserState] = useState<string | null>(null);

  // Show teaser as user types
  useEffect(() => {
    setTeaserState(detectStateFromAddress(inputAddress));
  }, [inputAddress]);

  const lookupAddress = useCallback(async (addr: string, placeId?: string) => {
    const trimmed = addr.trim();
    if (!trimmed) { setError('Please enter your full property address.'); return; }

    setIsGeocoding(true);
    setError('');
    setGeocode(null);
    setSatelliteUrl(null);
    setAddressConfirmed(false);

    try {
      // Prefer place_id lookup (more reliable than text geocoding)
      const geocodeUrl = placeId
        ? `/api/geocode?place_id=${encodeURIComponent(placeId)}`
        : `/api/geocode?address=${encodeURIComponent(trimmed)}`;

      const geoRes = await fetch(geocodeUrl);
      const geoData = await geoRes.json();
      if (!geoRes.ok || !geoData.lat) {
        setError('Address not found. Please enter a full street address including city and state.');
        return;
      }

      setGeocode(geoData);

      // Fetch satellite thumbnail URL
      const satRes = await fetch(`/api/satellite?lat=${geoData.lat}&lng=${geoData.lng}&zoom=19&w=640&h=360`);
      const satData = await satRes.json();
      if (satData.url) setSatelliteUrl(satData.url);

    } catch {
      setError('Unable to verify address. Please try again.');
    } finally {
      setIsGeocoding(false);
    }
  }, [setGeocode, setSatelliteUrl, setAddressConfirmed]);

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    lookupAddress(inputAddress);
  };

  const handleSelectAddress = useCallback((addr: string, placeId: string) => {
    setInputAddress(addr);
    setError('');
    setTimeout(() => lookupAddress(addr, placeId), 50);
  }, [setInputAddress, lookupAddress]);

  const handleConfirm = () => {
    setAddressConfirmed(true);
    setStep('qualify');
  };

  const handleRetry = () => {
    setGeocode(null);
    setSatelliteUrl(null);
    setAddressConfirmed(false);
    setInputAddress('');
  };

  const hasProgram = teaserState && STATES_WITH_PROGRAMS.includes(teaserState);
  const detectedState = geocode?.state ?? detectStateFromAddress(inputAddress);
  const detectedZip   = geocode?.zipCode ?? detectZipFromAddress(inputAddress);

  // ── Confirmation card (after geocode succeeds) ──────────────────────────────
  if (geocode && !addressConfirmed) {
    return (
      <div className="animate-slide-up">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📍</div>
          <h2 className="text-2xl font-black text-slate-900 mb-1">Is this your property?</h2>
          <p className="text-slate-500 text-sm">Please confirm the address before we check your eligibility.</p>
        </div>

        {/* Satellite image */}
        {satelliteUrl && (
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm mb-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={satelliteUrl}
              alt="Satellite view of your property"
              className="w-full object-cover"
              style={{ height: 220 }}
            />
            <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-medium">🛰 Google Satellite — visual reference only</span>
            </div>
          </div>
        )}

        {/* Address details card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 font-medium">Address</span>
            <span className="text-slate-900 font-semibold text-right max-w-[65%]">{geocode.formattedAddress}</span>
          </div>
          {geocode.city && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">City</span>
              <span className="text-slate-700">{geocode.city}</span>
            </div>
          )}
          {detectedState && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">State</span>
              <span className="text-slate-700">{detectedState}</span>
            </div>
          )}
          {detectedZip && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">ZIP Code</span>
              <span className="text-slate-700">{detectedZip}</span>
            </div>
          )}
          {geocode.county && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">County</span>
              <span className="text-slate-700">{geocode.county}</span>
            </div>
          )}
        </div>

        {/* Program teaser */}
        {detectedState && STATES_WITH_PROGRAMS.includes(detectedState) && (
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-3 mb-5 border"
            style={{ background: `${ACCENT}10`, borderColor: `${ACCENT}30` }}
          >
            <Sparkles size={16} style={{ color: ACCENT }} />
            <p className="text-sm font-semibold" style={{ color: ACCENT }}>
              🏆 {detectedState} has active FORTIFIED grant programs!
            </p>
          </div>
        )}

        {/* Confirm / Retry */}
        <div className="flex gap-3">
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm"
          >
            <RefreshCw size={15} /> Search again
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 text-sm"
            style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})` }}
          >
            <CheckCircle size={16} /> Yes, this is my property
          </button>
        </div>
      </div>
    );
  }

  // ── Address input form ──────────────────────────────────────────────────────
  return (
    <div className="animate-slide-up">
      {/* Hero */}
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})` }}
        >
          <Shield size={30} className="text-white" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
          Check Your Grant Eligibility
        </h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Enter your property address and we'll instantly check if you qualify for{' '}
          <strong>up to $15,000 in free government grants</strong> and up to{' '}
          <strong>55% off your insurance premium</strong> through the FORTIFIED™ Roof program.
        </p>
      </div>

      {/* Teaser badge */}
      {hasProgram && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3 mb-5 border"
          style={{ background: `${ACCENT}10`, borderColor: `${ACCENT}30` }}
        >
          <Sparkles size={16} style={{ color: ACCENT }} />
          <p className="text-sm font-semibold" style={{ color: ACCENT }}>
            🏆 {teaserState} has active FORTIFIED grant programs! Continue to check your property.
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmitForm} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Property Address *</label>
          <AddressAutocomplete
            value={inputAddress}
            onChange={(val) => { setInputAddress(val); setError(''); }}
            onSelect={handleSelectAddress}
            placeholder="123 Main St, Mobile, AL 36601"
            accentColor={ACCENT}
            icon="pin"
            autoFocus
          />
          {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-2 py-1">
          {[
            { icon: '🛡️', label: 'IBHS FORTIFIED™' },
            { icon: '🏛️', label: 'State-Backed Grants' },
            { icon: '💰', label: 'Insurance Savings' },
          ].map((b) => (
            <div key={b.label} className="rounded-xl p-2.5 text-center border border-slate-100 bg-slate-50">
              <div className="text-xl mb-1">{b.icon}</div>
              <p className="text-[10px] font-semibold text-slate-500">{b.label}</p>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={isGeocoding || !inputAddress.trim()}
          className="w-full py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})` }}
        >
          {isGeocoding ? (
            <span className="animate-pulse">Verifying address...</span>
          ) : (
            <>Check My Grant Eligibility <ArrowRight size={18} /></>
          )}
        </button>

        <p className="text-center text-xs text-slate-400">
          Free analysis · No commitment · Takes 2 minutes
        </p>
      </form>
    </div>
  );
}
