import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccountSwitcher } from '@/components/v1/AccountSwitcher';

describe('AccountSwitcher', () => {
  beforeEach(() => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
  });

  it('shows "No wallet connected" when currentAddress is null', () => {
    render(<AccountSwitcher currentAddress={null} onSwitch={vi.fn()} />);
    expect(screen.getByText('No wallet connected')).toBeTruthy();
  });

  it('truncates long addresses in the trigger', () => {
    const longAddress = '0xABCDEF1234567890ABCDEF';
    render(<AccountSwitcher currentAddress={longAddress} onSwitch={vi.fn()} />);
    const trigger = screen.getByTestId('account-switcher-trigger');
    // Should show truncated form: first 6 chars + … + last 4 chars
    expect(trigger.textContent).toContain('0xABCD');
    expect(trigger.textContent).toContain('CDEF');
    expect(trigger.textContent).not.toBe(longAddress);
  });

  it('opens menu on trigger click', () => {
    render(
      <AccountSwitcher currentAddress="0x1234567890abcdef" onSwitch={vi.fn()} />
    );
    expect(screen.queryByTestId('account-switcher-menu')).toBeNull();
    fireEvent.click(screen.getByTestId('account-switcher-trigger'));
    expect(screen.getByTestId('account-switcher-menu')).toBeTruthy();
  });

  it('shows "No recent accounts" when no other accounts exist', () => {
    render(
      <AccountSwitcher currentAddress="0x1234567890abcdef" onSwitch={vi.fn()} />
    );
    fireEvent.click(screen.getByTestId('account-switcher-trigger'));
    expect(screen.getByTestId('account-switcher-empty')).toBeTruthy();
    expect(screen.getByText('No recent accounts.')).toBeTruthy();
  });

  it('clicking a recent account calls onSwitch with full address and closes menu', () => {
    const recentAddr = '0xAAAABBBBCCCCDDDD';
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(
      JSON.stringify([recentAddr, '0x1234567890abcdef'])
    );

    const onSwitch = vi.fn();
    render(
      <AccountSwitcher currentAddress="0x1234567890abcdef" onSwitch={onSwitch} />
    );
    fireEvent.click(screen.getByTestId('account-switcher-trigger'));

    const itemBtn = screen.getByTestId(`account-switcher-item-${recentAddr}`);
    fireEvent.click(itemBtn);

    expect(onSwitch).toHaveBeenCalledWith(recentAddr);
    expect(screen.queryByTestId('account-switcher-menu')).toBeNull();
  });

  it('closes menu on outside click', () => {
    render(
      <AccountSwitcher currentAddress="0x1234567890abcdef" onSwitch={vi.fn()} />
    );
    fireEvent.click(screen.getByTestId('account-switcher-trigger'));
    expect(screen.getByTestId('account-switcher-menu')).toBeTruthy();

    // Simulate mousedown outside the component
    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId('account-switcher-menu')).toBeNull();
  });
});
