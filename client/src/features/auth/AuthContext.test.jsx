import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider, useAuth } from './AuthContext';
import { api } from './api';

vi.mock('./api', () => ({
    api: {
        me: vi.fn(),
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
    },
}));

function Probe() {
    const { user, loading, login, logout } = useAuth();
    return (
        <div>
            <span data-testid="state">
                {loading ? 'loading' : user ? `signed in as ${user.userName}` : 'signed out'}
            </span>
            <button onClick={() => login('alice', 'pw')}>sign in</button>
            <button onClick={() => logout()}>sign out</button>
        </div>
    );
}

const renderProbe = () => render(<AuthProvider><Probe /></AuthProvider>);
const state = () => screen.getByTestId('state').textContent;

describe('AuthProvider', () => {
    beforeEach(() => {
        api.me.mockReset();
        api.login.mockReset();
        api.logout.mockReset();
    });

    it('reports loading until the session check resolves', async () => {
        let resolveMe;
        api.me.mockReturnValue(new Promise((resolve) => { resolveMe = resolve; }));

        renderProbe();
        expect(state()).toBe('loading');

        resolveMe({ user: { id: '1', userName: 'alice' } });
        await waitFor(() => expect(state()).toBe('signed in as alice'));
    });

    it('restores an existing session on mount', async () => {
        api.me.mockResolvedValue({ user: { id: '1', userName: 'alice' } });

        renderProbe();
        await waitFor(() => expect(state()).toBe('signed in as alice'));
        expect(api.me).toHaveBeenCalledTimes(1);
    });

    it('treats a rejected session check as signed out rather than an error', async () => {
        api.me.mockRejectedValue(Object.assign(new Error('Not signed in'), { status: 401 }));

        renderProbe();
        await waitFor(() => expect(state()).toBe('signed out'));
    });

    it('signs in', async () => {
        api.me.mockRejectedValue(new Error('Not signed in'));
        api.login.mockResolvedValue({ user: { id: '2', userName: 'bob' } });

        renderProbe();
        await waitFor(() => expect(state()).toBe('signed out'));

        await userEvent.click(screen.getByText('sign in'));
        await waitFor(() => expect(state()).toBe('signed in as bob'));
        expect(api.login).toHaveBeenCalledWith('alice', 'pw');
    });

    it('clears the user even when the logout request fails', async () => {
        api.me.mockResolvedValue({ user: { id: '1', userName: 'alice' } });
        api.logout.mockRejectedValue(new Error('network down'));

        renderProbe();
        await waitFor(() => expect(state()).toBe('signed in as alice'));

        await userEvent.click(screen.getByText('sign out'));

        // Staying signed in locally after a failed sign-out is worse than
        // signing out twice, so the local state is dropped either way.
        await waitFor(() => expect(state()).toBe('signed out'));
    });
});
