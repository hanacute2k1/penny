import { describe, expect, it } from 'vitest';
import { ACCOUNT } from '@/lib/constants';
import {
  accountName,
  isValidUsername,
  normalizeUsername,
  usernameEmail,
  usernameFromEmail,
} from '../username';

describe('usernames', () => {
  it('accepts 3–24 lowercase letters, digits and . _ -', () => {
    for (const ok of ['abc', 'hana', 'hana.nguyen', 'h_2001', 'a-b', 'x'.repeat(24)]) {
      expect(isValidUsername(ok)).toBe(true);
    }
  });

  it('rejects the rest', () => {
    for (const bad of ['ab', 'x'.repeat(25), 'Hana', 'hà', 'a b', '.abc', 'abc_', 'a@b', '']) {
      expect(isValidUsername(bad)).toBe(false);
    }
  });

  it('trims and lowercases what was typed', () => {
    expect(normalizeUsername('  Hana.N ')).toBe('hana.n');
  });

  it('maps a username to its sign-in address and back', () => {
    const email = usernameEmail(' Hana ');
    expect(email).toBe(`hana@${ACCOUNT.emailDomain}`);
    expect(usernameFromEmail(email)).toBe('hana');
    expect(accountName(email)).toBe('hana');
  });

  it('shows real emails as they are', () => {
    expect(usernameFromEmail('someone@gmail.com')).toBeNull();
    expect(accountName('someone@gmail.com')).toBe('someone@gmail.com');
    expect(accountName(null)).toBeNull();
  });
});
