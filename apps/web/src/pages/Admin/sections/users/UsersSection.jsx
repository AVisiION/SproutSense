import React, { useState } from 'react';
import { ROLE } from '../../../../auth/permissions';
import '../SectionStyles.css';

export default function UsersSection({
  filteredUsers,
  loadUsers,
  usersLoading,
  users,
  userForm,
  handleUserFormChange,
  creatingUser,
  handleCreateUser,
  resetUserForm,
  usersQuery,
  setUsersQuery,
  selectedUserIds,
  handleSelectAllUsers,
  handleToggleUserSelection,
  user,
  handleViewUserDashboard,
  handleUserRoleUpdate,
  handleUserStatusUpdate,
  handleOpenDeleteModal,
  isBulkActionLoading,
  handleBulkAction,
  setSelectedUserIds,
  isDeleteModalOpen,
  setIsDeleteModalOpen,
  userToDelete,
  handleConfirmDeleteUser,
}) {
  const [usersView, setUsersView] = useState('table');

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2><i className="fa-solid fa-users" /> Identity & Access</h2>
        <span className="adm-section-badge">{filteredUsers.length} Logged Identities</span>
      </div>

      <div className="adm-btn-row">
        <button className="adm-icon-btn" onClick={loadUsers} title="Sync User Data">
          <i className={`fa-solid fa-rotate ${usersLoading ? 'fa-spin' : ''}`} />
        </button>
      </div>

      <div className="adm-dashboard-grid adm-users-stats-grid">
        <div className="adm-glass-box adm-mini-widget">
          <div className="adm-mini-icon adm-overview-icon--users">
            <i className="fa-solid fa-users-viewfinder" />
          </div>
          <div className="adm-mini-info">
            <span className="adm-mini-label">Total Registry</span>
            <span className="adm-mini-value">{users.length}</span>
          </div>
        </div>
        <div className="adm-glass-box adm-mini-widget">
          <div className="adm-mini-icon adm-overview-icon--leaf">
            <i className="fa-solid fa-user-check" />
          </div>
          <div className="adm-mini-info">
            <span className="adm-mini-label">Active Profiles</span>
            <span className="adm-mini-value">{users.filter((u) => u.accountStatus === 'active').length}</span>
          </div>
        </div>
        <div className="adm-glass-box adm-mini-widget">
          <div className="adm-mini-icon adm-overview-icon--database">
            <i className="fa-solid fa-user-clock" />
          </div>
          <div className="adm-mini-info">
            <span className="adm-mini-label">Pending Verification</span>
            <span className="adm-mini-value">{users.filter((u) => u.accountStatus === 'pending_verification').length}</span>
          </div>
        </div>
      </div>

      <div className="adm-glass-box adm-users-provision-card">
        <h3 className="adm-users-provision-title">
          <i className="fa-solid fa-user-plus adm-users-provision-icon" /> Identity Provisioning
        </h3>

        <div className="adm-form-grid">
          <div className="adm-form-group">
            <label>Full Identity Name</label>
            <input className="adm-input" type="text" placeholder="e.g. John Doe" value={userForm.fullName} onChange={(e) => handleUserFormChange('fullName', e.target.value)} />
          </div>
          <div className="adm-form-group">
            <label>Security Email</label>
            <input className="adm-input" type="email" placeholder="user@sproutsense.io" value={userForm.email} onChange={(e) => handleUserFormChange('email', e.target.value)} />
          </div>
          <div className="adm-form-group">
            <label>Initial Passkey</label>
            <input className="adm-input" type="password" placeholder="************" value={userForm.password} onChange={(e) => handleUserFormChange('password', e.target.value)} />
          </div>
          <div className="adm-form-group">
            <label>Assigned Role</label>
            <select className="adm-input" value={userForm.roleKey} onChange={(e) => handleUserFormChange('roleKey', e.target.value)}>
              <option value={ROLE.ADMIN}>Administrator</option>
              <option value={ROLE.USER}>Standard User</option>
              <option value={ROLE.VIEWER}>Guest Viewer</option>
            </select>
          </div>
        </div>

        <div className="adm-toggle-group">
          <label className="adm-toggle-label">
            <input type="checkbox" checked={Boolean(userForm.emailVerified)} onChange={(e) => handleUserFormChange('emailVerified', e.target.checked)} />
            <span>Pre-Verify Email</span>
          </label>
          <label className="adm-toggle-label">
            <input type="checkbox" checked={Boolean(userForm.sensorDataVisible)} onChange={(e) => handleUserFormChange('sensorDataVisible', e.target.checked)} />
            <span>Allow Sensor Data</span>
          </label>
        </div>

        <div className="adm-btn-row adm-users-provision-actions">
          <button className="adm-action-btn adm-action-btn--start" onClick={handleCreateUser} disabled={creatingUser}>
            <i className="fa-solid fa-plus-circle" /> {creatingUser ? 'Provisioning...' : 'Provision New Identity'}
          </button>
          <button className="adm-action-btn adm-action-btn--ghost" onClick={resetUserForm}>Reset Form</button>
        </div>
      </div>

      <div className="adm-toolbar adm-users-toolbar-pro">
        <div className="adm-search-container adm-users-search-container">
          <i className="fa-solid fa-magnifying-glass" />
          <input type="text" placeholder="Search by name, email or role..." value={usersQuery} onChange={(e) => setUsersQuery(e.target.value)} />
        </div>
        <div className="adm-users-toolbar-actions">
          <button
            className="adm-action-btn adm-action-btn--ghost adm-users-view-toggle"
            onClick={() => setUsersView((prev) => (prev === 'table' ? 'cards' : 'table'))}
            type="button"
          >
            <i className={`fa-solid ${usersView === 'table' ? 'fa-table-cells-large' : 'fa-table-list'}`} />
            {usersView === 'table' ? 'Cards View' : 'Table View'}
          </button>
          <div className="adm-users-select-all-wrap">
            <span className="adm-users-select-all-label">Select All</span>
            <label className="adm-toggle-sm">
              <input
                type="checkbox"
                checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                onChange={() => handleSelectAllUsers(filteredUsers)}
              />
              <span className="slider-sm" />
            </label>
          </div>
        </div>
      </div>

      {usersLoading ? (
        <div className="adm-loading-block">
          <i className="fa-solid fa-circle-notch fa-spin" />
          <span>Syncing Identity Registry...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="adm-empty-state">
          <i className="fa-solid fa-users-slash" />
          <p>No identities found matching the search parameters.</p>
        </div>
      ) : usersView === 'table' ? (
        <div className="adm-glass-box adm-users-table-shell">
          <div className="adm-users-table-wrap">
            <table className="adm-users-table">
              <thead>
                <tr>
                  <th className="adm-users-col-select">Select</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Plant</th>
                  <th>Last Login</th>
                  <th className="adm-users-col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isSelf = u.email === user?.email;
                  const isSelected = selectedUserIds.includes(u.id);
                  return (
                    <tr key={u.id} className={isSelected ? 'adm-users-row--selected' : ''}>
                      <td className="adm-users-col-select">
                        <input type="checkbox" checked={isSelected} onChange={() => handleToggleUserSelection(u.id)} />
                      </td>
                      <td>
                        <div className="adm-users-identity-cell">
                          <div className={`adm-user-avatar adm-user-avatar--${u.role}`}>
                            {u.fullName?.charAt(0).toUpperCase() || '?'}
                            {u.accountStatus === 'active' && <span className="adm-user-online-dot" title="Active Account" />}
                          </div>
                          <div className="adm-users-identity-meta">
                            <div className="adm-users-identity-name">
                              {u.fullName} {isSelf && <span className="adm-self-pill">YOU</span>}
                            </div>
                            <div className="adm-users-identity-email">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <select className="adm-users-inline-select" value={u.role} onChange={(e) => handleUserRoleUpdate(u, e.target.value)} disabled={isSelf}>
                          <option value="admin">Admin</option>
                          <option value="user">User</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </td>
                      <td>
                        <select
                          className="adm-users-inline-select"
                          value={u.accountStatus}
                          onChange={(e) => handleUserStatusUpdate(u, e.target.value)}
                          disabled={isSelf && u.role === 'admin'}
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspend</option>
                          <option value="disabled">Disable</option>
                        </select>
                      </td>
                      <td>{u.preferredPlant || 'Default Garden'}</td>
                      <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never Seen'}</td>
                      <td className="adm-users-col-actions">
                        <button className="adm-card-btn" onClick={() => handleViewUserDashboard(u)} title="View Dashboard">
                          <i className="fa-solid fa-desktop" />
                        </button>
                        <button
                          className="adm-card-btn adm-card-btn--danger"
                          onClick={() => handleOpenDeleteModal(u)}
                          disabled={isSelf}
                          title="Purge Identity"
                        >
                          <i className="fa-solid fa-trash-can" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="adm-users-cards-grid">
          {filteredUsers.map((u) => {
            const isSelf = u.email === user?.email;
            const isSelected = selectedUserIds.includes(u.id);
            return (
              <div key={u.id} className={`adm-glass-box adm-users-view-card ${isSelected ? 'adm-users-view-card--selected' : ''}`}>
                <div className="adm-users-view-card-head">
                  <label className="adm-users-view-card-select">
                    <input type="checkbox" checked={isSelected} onChange={() => handleToggleUserSelection(u.id)} />
                    <span>Select</span>
                  </label>
                  <span className="adm-users-view-status">{u.accountStatus}</span>
                </div>

                <div className="adm-users-identity-cell">
                  <div className={`adm-user-avatar adm-user-avatar--${u.role}`}>
                    {u.fullName?.charAt(0).toUpperCase() || '?'}
                    {u.accountStatus === 'active' && <span className="adm-user-online-dot" title="Active Account" />}
                  </div>
                  <div className="adm-users-identity-meta">
                    <div className="adm-users-identity-name">
                      {u.fullName} {isSelf && <span className="adm-self-pill">YOU</span>}
                    </div>
                    <div className="adm-users-identity-email">{u.email}</div>
                  </div>
                </div>

                <div className="adm-users-view-fields">
                  <label>
                    <span>Role</span>
                    <select className="adm-users-inline-select" value={u.role} onChange={(e) => handleUserRoleUpdate(u, e.target.value)} disabled={isSelf}>
                      <option value="admin">Admin</option>
                      <option value="user">User</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </label>
                  <label>
                    <span>Status</span>
                    <select
                      className="adm-users-inline-select"
                      value={u.accountStatus}
                      onChange={(e) => handleUserStatusUpdate(u, e.target.value)}
                      disabled={isSelf && u.role === 'admin'}
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspend</option>
                      <option value="disabled">Disable</option>
                    </select>
                  </label>
                  <div className="adm-users-view-meta">Plant: {u.preferredPlant || 'Default Garden'}</div>
                  <div className="adm-users-view-meta">Last Login: {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never Seen'}</div>
                </div>

                <div className="adm-users-view-card-actions">
                  <button className="adm-card-btn" onClick={() => handleViewUserDashboard(u)} title="View Dashboard">
                    <i className="fa-solid fa-desktop" />
                  </button>
                  <button
                    className="adm-card-btn adm-card-btn--danger"
                    onClick={() => handleOpenDeleteModal(u)}
                    disabled={isSelf}
                    title="Purge Identity"
                  >
                    <i className="fa-solid fa-trash-can" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={`adm-bulk-bar ${selectedUserIds.length > 0 ? 'adm-bulk-bar--visible' : ''}`}>
        <div className="adm-bulk-info">
          <span className="adm-bulk-count">{selectedUserIds.length}</span> identities selected
        </div>
        <div className="adm-bulk-actions">
          <button className="adm-bulk-action" onClick={() => handleBulkAction('status', 'suspended')} disabled={isBulkActionLoading}>
            <i className="fa-solid fa-user-slash" /> Suspend
          </button>
          <button className="adm-bulk-action" onClick={() => handleBulkAction('status', 'active')} disabled={isBulkActionLoading}>
            <i className="fa-solid fa-user-check" /> Activate
          </button>
          <div className="adm-bulk-divider" />
          <button className="adm-bulk-action adm-bulk-action--danger" onClick={() => handleBulkAction('delete')} disabled={isBulkActionLoading}>
            <i className="fa-solid fa-trash" /> Purge Selection
          </button>
          <button className="adm-bulk-close" onClick={() => setSelectedUserIds([])}>
            <i className="fa-solid fa-times" />
          </button>
        </div>
      </div>

      {isDeleteModalOpen && (
        <div className="adm-modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="adm-modal-content adm-glass-box" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header adm-users-delete-header">
              <i className="fa-solid fa-triangle-exclamation" />
              <h3 className="adm-users-delete-title">Confirm Identity Purge</h3>
            </div>
            <div className="adm-modal-body">
              <p>You are about to permanently delete <strong>{userToDelete?.fullName}</strong> ({userToDelete?.email}).</p>
              <p className="adm-users-delete-sub">This action is irreversible and will remove all associated telemetry history.</p>
            </div>
            <div className="adm-modal-footer">
              <button className="adm-action-btn adm-action-btn--ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
              <button className="adm-action-btn adm-action-btn--stop" onClick={handleConfirmDeleteUser}>
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
