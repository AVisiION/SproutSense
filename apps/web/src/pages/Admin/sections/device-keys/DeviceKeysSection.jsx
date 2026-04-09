import React, { useState } from 'react';

export default function DeviceKeysSection({
  DEVICE_KEY_PRESETS,
  handleCreatePresetDeviceKey,
  creatingDeviceKey,
  deviceKeyForm,
  setDeviceKeyForm,
  lastGeneratedPairingKey,
  selectedDeviceType,
  setSelectedDeviceType,
  handleGenerateDeviceId,
  handleGeneratePairingKey,
  handleCreateDeviceKey,
  generatedDeviceToken,
  handleCopyDeviceToken,
  handleCopyPairingKey,
  keySearch,
  setKeySearch,
  loadDeviceKeys,
  loadingDeviceKeys,
  deviceKeys,
  selectedKeys,
  handleSelectKey,
  handleForceUnpair,
  handleOpenForcePairModal,
  handleToggleDeviceKeyStatus,
  handleDeleteDeviceKey,
  setSelectedKeys,
  handleBatchRevoke,
  isBatchRevoking,
}) {
  const [activeTab, setActiveTab] = useState('generate');

  const activePreset = DEVICE_KEY_PRESETS.find((preset) => preset.deviceId === selectedDeviceType) || DEVICE_KEY_PRESETS[0];

  return (
    <div className="adm-section">
      <div className="adm-section-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem 0', fontWeight: '700', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#f8fafc' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(14,165,233,0.1))', color: '#22d3ee' }}>
              <i className="fa-solid fa-key" style={{ fontSize: '1.2rem' }} />
            </span>
            Device Authentication Keys
          </h2>
          <p style={{ margin: '0', color: '#94a3b8', fontSize: '0.95rem' }}>
            Use the device ID for hardware identity and the pairing key for website registration.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(148, 163, 184, 0.2)', marginBottom: '2rem', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('generate')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.5rem 1rem',
            color: activeTab === 'generate' ? '#22d3ee' : '#94a3b8',
            fontWeight: activeTab === 'generate' ? '600' : '500',
            fontSize: '1rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'generate' ? '2px solid #22d3ee' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <i className="fa-solid fa-plus-circle" /> Generate Pair
        </button>
        <button
          onClick={() => setActiveTab('manage')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.5rem 1rem',
            color: activeTab === 'manage' ? '#22d3ee' : '#94a3b8',
            fontWeight: activeTab === 'manage' ? '600' : '500',
            fontSize: '1rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'manage' ? '2px solid #22d3ee' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <i className="fa-solid fa-list-check" /> Manage Keys
        </button>
      </div>

      {activeTab === 'generate' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) minmax(400px, 1fr)', gap: '2rem', alignItems: 'start' }}>
          <div className="adm-glass-box" style={{ padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-microchip" style={{ color: '#22d3ee' }} /> New Device Pair
              </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                Generate a unique device ID and a separate pairing key for the website.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                  Device Type
                </label>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {DEVICE_KEY_PRESETS.map((preset) => {
                    const isActive = selectedDeviceType === preset.deviceId;
                    return (
                      <button
                        key={preset.deviceId}
                        type="button"
                        onClick={() => setSelectedDeviceType(preset.deviceId)}
                        style={{
                          background: isActive ? 'rgba(34, 211, 238, 0.16)' : 'rgba(51, 65, 85, 0.45)',
                          border: isActive ? '1px solid rgba(34, 211, 238, 0.45)' : '1px solid rgba(71, 85, 105, 0.45)',
                          color: isActive ? '#67e8f9' : '#cbd5e1',
                          padding: '0.65rem 0.9rem',
                          borderRadius: '0.75rem',
                          fontSize: '0.82rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <i className={`fa-solid ${preset.deviceId === 'ESP32-CAM' ? 'fa-camera' : 'fa-microchip'}`} />
                        {preset.deviceId}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                  Device ID
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    value={deviceKeyForm.deviceId}
                    onChange={(e) => setDeviceKeyForm({ ...deviceKeyForm, deviceId: e.target.value.toUpperCase().replace(/\s+/g, '-') })}
                    placeholder="Generate or type a device ID"
                    maxLength={50}
                    style={{
                      flex: 1,
                      padding: '0.9rem 1rem',
                      background: 'rgba(15, 23, 42, 0.45)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontFamily: 'monospace',
                      fontSize: '0.98rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleGenerateDeviceId(selectedDeviceType)}
                    style={{
                      background: 'var(--admin-gradient-sky-blue)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.75rem',
                      padding: '0.9rem 1rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <i className="fa-solid fa-wand-magic-sparkles" /> Generate
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.5rem 0 0 0' }}>
                  This identifier is used to track the hardware in the registry and firmware.
                </p>
              </div>

              <div>
                <label style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                  Pairing Key
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    value={deviceKeyForm.pairingKey}
                    onChange={(e) => setDeviceKeyForm({ ...deviceKeyForm, pairingKey: e.target.value.toUpperCase().replace(/\s+/g, '-') })}
                    placeholder="Generate or type a pairing key"
                    maxLength={50}
                    style={{
                      flex: 1,
                      padding: '0.9rem 1rem',
                      background: 'rgba(15, 23, 42, 0.45)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontFamily: 'monospace',
                      fontSize: '0.98rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleGeneratePairingKey(selectedDeviceType)}
                    style={{
                      background: 'var(--admin-gradient-teal-cyan)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.75rem',
                      padding: '0.9rem 1rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <i className="fa-solid fa-wand-magic-sparkles" /> Generate
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.5rem 0 0 0' }}>
                  This key is entered by the user on the website to start pairing.
                </p>
              </div>

              <div>
                <label style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                  Device Name
                </label>
                <input
                  type="text"
                  value={deviceKeyForm.displayName}
                  onChange={(e) => setDeviceKeyForm({ ...deviceKeyForm, displayName: e.target.value })}
                  placeholder={activePreset?.displayName || 'ESP32 Sensor Node'}
                  maxLength={120}
                  style={{
                    width: '100%',
                    padding: '0.9rem 1rem',
                    background: 'rgba(15, 23, 42, 0.45)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '0.95rem',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                onClick={handleCreateDeviceKey}
                disabled={creatingDeviceKey || !deviceKeyForm.deviceId}
                style={{
                  width: '100%',
                  background: 'var(--admin-gradient-teal-cyan)',
                  color: '#fff',
                  padding: '0.95rem 1.25rem',
                  border: 'none',
                  borderRadius: '0.85rem',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  cursor: creatingDeviceKey || !deviceKeyForm.deviceId ? 'not-allowed' : 'pointer',
                  opacity: creatingDeviceKey || !deviceKeyForm.deviceId ? 0.65 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                }}
              >
                {creatingDeviceKey ? <><i className="fa-solid fa-spinner fa-spin" /> Generating Pair</> : <><i className="fa-solid fa-bolt" /> Create Device Pair</>}
              </button>

              <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px dashed rgba(148, 163, 184, 0.2)' }}>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.75rem 0', fontWeight: '500' }}>Quick Start Presets</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {DEVICE_KEY_PRESETS.map((preset) => (
                    <button
                      key={preset.deviceId}
                      type="button"
                      onClick={() => handleCreatePresetDeviceKey(preset)}
                      disabled={creatingDeviceKey}
                      style={{
                        background: 'rgba(51, 65, 85, 0.4)',
                        border: '1px solid rgba(71, 85, 105, 0.4)',
                        color: '#cbd5e1',
                        padding: '0.45rem 0.8rem',
                        borderRadius: '0.6rem',
                        fontSize: '0.8rem',
                        cursor: creatingDeviceKey ? 'not-allowed' : 'pointer',
                        opacity: creatingDeviceKey ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <i className={`fa-solid ${preset.deviceId === 'ESP32-CAM' ? 'fa-camera' : 'fa-microchip'}`} />
                      Create {preset.deviceId}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="adm-glass-box" style={{ padding: '0', borderRadius: '1rem', border: '1px solid rgba(34, 211, 238, 0.2)', overflow: 'hidden' }}>
            <div style={{ background: 'rgba(34, 211, 238, 0.05)', padding: '1.5rem 2rem', borderBottom: '1px solid rgba(34, 211, 238, 0.1)' }}>
              <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.35rem 0', color: '#22d3ee', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-shield-halved" /> Generated Pair
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                Use the device ID to identify the hardware and the pairing key to register it on the website.
              </p>
            </div>

            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#22d3ee', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="fa-solid fa-globe" /> Pairing Key for Website
                  </span>
                  {lastGeneratedPairingKey && (
                    <button
                      type="button"
                      onClick={handleCopyPairingKey}
                      style={{
                        background: 'rgba(34, 211, 238, 0.12)',
                        border: '1px solid rgba(34, 211, 238, 0.25)',
                        color: '#67e8f9',
                        borderRadius: '0.55rem',
                        padding: '0.45rem 0.75rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                      }}
                    >
                      <i className="fa-solid fa-copy" /> Copy
                    </button>
                  )}
                </div>
                <div style={{
                  padding: '0.9rem 1rem',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(34, 211, 238, 0.25)',
                  borderRadius: '0.75rem',
                  fontFamily: 'monospace',
                  color: '#67e8f9',
                  fontSize: '0.98rem',
                  fontWeight: '700',
                  letterSpacing: '0.5px',
                  wordBreak: 'break-all',
                }}>
                  {lastGeneratedPairingKey || 'Generate a pairing key to display it here'}
                </div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.45rem 0 0 0' }}>
                  User enters this value during registration.
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#ef4444', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="fa-solid fa-microchip" /> Device Secret for .ino
                  </span>
                  {generatedDeviceToken && (
                    <button
                      type="button"
                      onClick={handleCopyDeviceToken}
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#f87171',
                        borderRadius: '0.55rem',
                        padding: '0.45rem 0.75rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                      }}
                    >
                      <i className="fa-solid fa-copy" /> Copy
                    </button>
                  )}
                </div>
                <div style={{
                  padding: '0.9rem 1rem',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '0.75rem',
                  fontFamily: 'monospace',
                  color: '#f87171',
                  fontSize: '0.92rem',
                  wordBreak: 'break-all',
                }}>
                  {generatedDeviceToken || 'Generate a device secret to display it here'}
                </div>
                <p style={{ fontSize: '0.75rem', color: '#ef4444', margin: '0.45rem 0 0 0', display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  <i className="fa-solid fa-triangle-exclamation" /> Paste this into the ESP32 .ino file or firmware secret storage.
                </p>
              </div>

              <div style={{ padding: '1rem', borderRadius: '0.85rem', background: 'rgba(15, 23, 42, 0.55)', border: '1px solid rgba(148, 163, 184, 0.12)' }}>
                <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem', fontWeight: '600' }}>
                  Provisioning flow
                </p>
                <p style={{ margin: '0.4rem 0 0 0', color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.6 }}>
                  1. Generate a unique device ID for the hardware.
                  <br />
                  2. Generate a separate pairing key for the website.
                  <br />
                  3. Keep both values together for provisioning.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="adm-glass-box" style={{ borderRadius: '1rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="adm-search-container" style={{ flex: '1', minWidth: '250px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '0.5rem', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ color: '#94a3b8', marginLeft: '1rem' }} />
              <input
                type="text"
                className="adm-search-input"
                placeholder="Search by Pairing Key, Name or Assignee..."
                value={keySearch}
                onChange={(e) => setKeySearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#f8fafc', padding: '0.75rem 1rem', flex: 1, outline: 'none' }}
              />
            </div>
            <button
              onClick={loadDeviceKeys}
              style={{
                background: 'rgba(51, 65, 85, 0.6)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                color: '#f8fafc',
                padding: '0.75rem 1.25rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '500',
              }}
            >
              <i className={`fa-solid fa-rotate ${loadingDeviceKeys ? 'fa-spin' : ''}`} style={{ color: '#22d3ee' }} />
              {loadingDeviceKeys ? 'Syncing...' : 'Refresh Register'}
            </button>
          </div>

          {loadingDeviceKeys ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: '#22d3ee', marginBottom: '1rem' }} />
              <p>Retrieving secure registry...</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {deviceKeys
                  .filter((k) => {
                    const q = keySearch.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      k.deviceId.toLowerCase().includes(q) ||
                      (k.displayName || '').toLowerCase().includes(q) ||
                      (k.linkedUser?.email || '').toLowerCase().includes(q) ||
                      (k.linkedUser?.fullName || '').toLowerCase().includes(q)
                    );
                  })
                  .map((key) => (
                    <div
                      key={key.deviceId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: selectedKeys.includes(key.deviceId) ? 'rgba(34, 211, 238, 0.05)' : 'rgba(30, 41, 59, 0.5)',
                        border: selectedKeys.includes(key.deviceId) ? '1px solid rgba(34, 211, 238, 0.3)' : '1px solid rgba(148, 163, 184, 0.1)',
                        padding: '1rem 1.25rem',
                        borderRadius: '0.75rem',
                        gap: '1.25rem',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => handleSelectKey(key.deviceId, !selectedKeys.includes(key.deviceId))}
                    >
                      <input
                        type="checkbox"
                        checked={selectedKeys.includes(key.deviceId)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectKey(key.deviceId, e.target.checked);
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#22d3ee' }}
                      />

                      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '1.05rem', color: '#f8fafc', letterSpacing: '0.5px' }}>
                            {key.deviceId}
                          </span>
                          <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', background: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', borderRadius: '1rem', fontWeight: '600' }}>
                            PAIRING KEY
                          </span>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                          {key.displayName || 'Unnamed Hardware Entry'}
                        </span>
                      </div>

                      <div style={{ flex: '1 1 250px', display: 'flex', alignItems: 'center', gap: '1rem', paddingLeft: '1rem', borderLeft: '1px solid rgba(148, 163, 184, 0.1)' }}>
                        {key.isLinked ? (
                          <>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--admin-gradient-indigo-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-avatar-text)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                              {key.linkedUser?.fullName?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: '500' }}>{key.linkedUser?.fullName}</span>
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{key.linkedUser?.email}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleForceUnpair(key.deviceId);
                              }}
                              style={{ marginLeft: 'auto', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.4rem 0.75rem', borderRadius: '0.4rem', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}
                              title="Force Unpair User"
                            >
                              Unpair
                            </button>
                          </>
                        ) : (
                          <>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(148, 163, 184, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', border: '1px dashed rgba(148, 163, 184, 0.3)' }}>
                              <i className="fa-solid fa-unlink" style={{ fontSize: '0.7rem' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Ready for pairing</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenForcePairModal(key.deviceId);
                              }}
                              style={{ marginLeft: 'auto', background: 'rgba(34, 211, 238, 0.1)', border: '1px solid rgba(34, 211, 238, 0.2)', padding: '0.4rem 0.75rem', borderRadius: '0.4rem', color: '#22d3ee', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}
                            >
                              Assign
                            </button>
                          </>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '120px', alignItems: 'flex-end', borderLeft: '1px solid rgba(148, 163, 184, 0.1)', paddingLeft: '1rem' }}>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          background: key.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                          color: key.isActive ? '#4ade80' : '#94a3b8',
                          border: key.isActive ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(100, 116, 139, 0.3)',
                          borderRadius: '1rem',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          letterSpacing: '0.5px',
                        }}>
                          {key.isActive ? 'ACTIVE' : 'REVOKED'}
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleDeviceKeyStatus(key.deviceId);
                            }}
                            style={{ background: 'none', border: 'none', color: key.isActive ? '#eab308' : '#94a3b8', cursor: 'pointer', fontSize: '1rem', padding: '0.2rem' }}
                            title={key.isActive ? 'Disable Key' : 'Enable Key'}
                          >
                            <i className={`fa-solid ${key.isActive ? 'fa-toggle-on' : 'fa-toggle-off'}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDeviceKey(key.deviceId);
                            }}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', padding: '0.2rem' }}
                            title="Delete Key"
                          >
                            <i className="fa-solid fa-trash-can" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {deviceKeys.length === 0 && (
                <div style={{ padding: '4rem 2rem', textAlign: 'center', border: '1px dashed rgba(148, 163, 184, 0.2)', borderRadius: '1rem', marginTop: '1rem', color: '#94a3b8' }}>
                  <i className="fa-solid fa-key" style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.5 }} />
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#e2e8f0', fontSize: '1.1rem' }}>No Authentication Keys</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>Generate the first pair to provision a device.</p>
                </div>
              )}
            </>
          )}

          {selectedKeys.length > 0 && (
            <div style={{
              position: 'fixed',
              bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              padding: '1rem 1.5rem',
              borderRadius: '3rem',
              display: 'flex',
              alignItems: 'center',
              gap: '2rem',
              zIndex: 100,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#22d3ee', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {selectedKeys.length}
                </div>
                <span style={{ color: '#f8fafc', fontWeight: '500' }}>Keys Selected</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', borderLeft: '1px solid rgba(148, 163, 184, 0.2)', paddingLeft: '1.5rem' }}>
                <button
                  onClick={() => setSelectedKeys([])}
                  style={{ background: 'transparent', border: '1px solid rgba(148, 163, 184, 0.3)', color: '#cbd5e1', padding: '0.5rem 1rem', borderRadius: '2rem', cursor: 'pointer', fontWeight: '500' }}
                >
                  Clear
                </button>
                <button
                  onClick={handleBatchRevoke}
                  disabled={isBatchRevoking}
                  style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '2rem', cursor: isBatchRevoking ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: isBatchRevoking ? 0.7 : 1 }}
                >
                  {isBatchRevoking ? 'Revoking...' : 'Revoke Access'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
