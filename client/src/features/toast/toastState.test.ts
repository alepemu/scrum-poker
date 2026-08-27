import { describe, expect, it } from 'vitest';
import type { Toast } from './toastContext';
import { dismissToast, MAX_TOASTS, upsertToast } from './toastState';

function toast(id: string, message = id): Toast {
  return { id, variant: 'info', message, duration: 4000 };
}

const ids = (toasts: Toast[]) => toasts.map((current) => current.id);

describe('upsertToast', () => {
  it('appends a toast with a new id', () => {
    const result = upsertToast([toast('a')], toast('b'));
    expect(ids(result)).toEqual(['a', 'b']);
  });

  it('replaces in place when the id is already on screen', () => {
    // The connection toast reuses one id across drop / retry / recovery, so a
    // reconnect storm has to overwrite rather than pile up.
    const result = upsertToast([toast('a'), toast('connection', 'Reconnecting…')], {
      id: 'connection',
      variant: 'success',
      message: 'Back online',
      duration: 2500,
    });

    expect(ids(result)).toEqual(['a', 'connection']);
    expect(result[1]).toMatchObject({ message: 'Back online', variant: 'success' });
  });

  it('keeps the position of the toast it replaces', () => {
    const result = upsertToast([toast('a'), toast('b'), toast('c')], toast('a', 'updated'));
    expect(ids(result)).toEqual(['a', 'b', 'c']);
    expect(result[0]?.message).toBe('updated');
  });

  it('drops the oldest once the stack is full', () => {
    const full = [toast('a'), toast('b'), toast('c')];
    expect(full).toHaveLength(MAX_TOASTS);

    expect(ids(upsertToast(full, toast('d')))).toEqual(['b', 'c', 'd']);
  });

  it('does not evict anything when replacing a full stack', () => {
    const full = [toast('a'), toast('b'), toast('c')];
    expect(ids(upsertToast(full, toast('a', 'updated')))).toEqual(['a', 'b', 'c']);
  });

  it('leaves the original list untouched', () => {
    const original = [toast('a')];
    upsertToast(original, toast('b'));
    expect(ids(original)).toEqual(['a']);
  });
});

describe('dismissToast', () => {
  it('removes only the matching toast', () => {
    const result = dismissToast([toast('a'), toast('b'), toast('c')], 'b');
    expect(ids(result)).toEqual(['a', 'c']);
  });

  it('is a no-op for an id that has already gone', () => {
    // A sticky toast dismissed by hand and then by its owner must not throw.
    expect(ids(dismissToast([toast('a')], 'gone'))).toEqual(['a']);
  });
});
