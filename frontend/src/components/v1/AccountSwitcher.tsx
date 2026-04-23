import React, { useCallback, useEffect, useRef, useState } from 'react';
import './AccountSwitcher.css';

const STORAGE_KEY = 'stellarcade.recent-accounts';
const MAX_RECENT = 5;

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function persistRecent(accounts: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch {}
}

export interface AccountSwitcherProps {
  currentAddress: string | null;
  onSwitch: (address: string) => void;
  testId?: string;
}

export const AccountSwitcher: React.FC<AccountSwitcherProps> = ({
  currentAddress,
  onSwitch,
  testId = 'account-switcher',
}) => {
  const [open, setOpen] = useState(false);
  const [recentAccounts, setRecentAccounts] = useState<string[]>(loadRecent);
  const menuRef = useRef<HTMLDivElement>(null);

  // Add current address to recents whenever it changes
  useEffect(() => {
    if (!currentAddress) return;
    setRecentAccounts((prev) => {
      const filtered = prev.filter((a) => a !== currentAddress);
      const updated = [currentAddress, ...filtered].slice(0, MAX_RECENT);
      persistRecent(updated);
      return updated;
    });
  }, [currentAddress]);

  // Close menu on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSwitch = useCallback((address: string) => {
    setOpen(false);
    onSwitch(address);
  }, [onSwitch]);

  const otherAccounts = recentAccounts.filter((a) => a !== currentAddress);

  return (
    <div className="account-switcher" ref={menuRef} data-testid={testId}>
      <button
        type="button"
        className="account-switcher__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        data-testid={`${testId}-trigger`}
      >
        <span className="account-switcher__address">
          {currentAddress ? truncateAddress(currentAddress) : 'No wallet connected'}
        </span>
        <span className="account-switcher__chevron" aria-hidden="true">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div
          className="account-switcher__menu"
          role="listbox"
          aria-label="Recent accounts"
          data-testid={`${testId}-menu`}
        >
          {otherAccounts.length === 0 ? (
            <p className="account-switcher__empty" data-testid={`${testId}-empty`}>
              No recent accounts.
            </p>
          ) : (
            <ul className="account-switcher__list">
              {otherAccounts.map((addr) => (
                <li key={addr}>
                  <button
                    type="button"
                    className="account-switcher__item"
                    role="option"
                    aria-selected={addr === currentAddress}
                    onClick={() => handleSwitch(addr)}
                    data-testid={`${testId}-item-${addr}`}
                  >
                    {truncateAddress(addr)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default AccountSwitcher;
