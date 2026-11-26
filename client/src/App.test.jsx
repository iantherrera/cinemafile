import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';
import { api } from './features/auth/api';

vi.mock('./features/auth/api', () => ({
    api: {
        me: vi.fn(),
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        getUserData: vi.fn(),
        saveMovieData: vi.fn(),
        resetMovieData: vi.fn(),
    },
}));

const signedIn = () => api.me.mockResolvedValue({ user: { id: '1', userName: 'alice' } });
const signedOut = () => api.me.mockRejectedValue(Object.assign(new Error('Not signed in'), { status: 401 }));

const renderAt = (path) => render(
    <MemoryRouter initialEntries={[path]}><App /></MemoryRouter>
);

describe('routing', () => {
    beforeEach(() => {
        api.me.mockReset();
        api.getUserData.mockReset();
        api.getUserData.mockResolvedValue({ movieData: [] });
    });

    it('sends an unauthenticated visitor to the login page', async () => {
        signedOut();
        renderAt('/');
        await waitFor(() => expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument());
        expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
        expect(screen.queryByText(/signed in as/i)).not.toBeInTheDocument();
    });

    it('shows the movie list to a signed-in visitor', async () => {
        signedIn();
        renderAt('/');
        await waitFor(() => expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument());
        expect(api.getUserData).toHaveBeenCalled();
    });

    it('names the signed-in user in the header', async () => {
        signedIn();
        renderAt('/');

        // The name is what the page shows; the prefix is carried alongside it
        // for anyone who hears the page rather than sees it, and is the only
        // thing left when the viewport is too narrow for the name.
        await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());
        expect(screen.getByText(/signed in as/i)).toBeInTheDocument();
    });

    it('sends a signed-in visitor away from the login page', async () => {
        signedIn();
        renderAt('/login');
        await waitFor(() => expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument());
    });

    it('sends a signed-in visitor away from the registration page', async () => {
        signedIn();
        renderAt('/register');
        await waitFor(() => expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument());
    });

    it('renders neither page while the session is still unknown', () => {
        api.me.mockReturnValue(new Promise(() => {}));
        renderAt('/');

        // Guessing either way flashes the wrong page at someone who turns out
        // to be the opposite.
        expect(screen.queryByRole('button', { name: /^login$/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
    });

    it('sends an unknown path to the list', async () => {
        signedIn();
        renderAt('/nonsense');
        await waitFor(() => expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument());
    });
});
