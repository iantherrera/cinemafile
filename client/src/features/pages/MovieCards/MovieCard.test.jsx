import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MovieCards from './MovieCard';
import { AuthProvider } from '../../auth/AuthContext';
import { api } from '../../auth/api';

vi.mock('../../auth/api', () => ({
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

const MOVIES = [
    { imdbId: 'tt1', rank: '1', movieTitle: 'Citizen Kane', year: '1941', checked: false, favorite: false, overview: 'a', posterPath: '/a.jpg' },
    { imdbId: 'tt2', rank: '2', movieTitle: 'The Godfather', year: '1972', checked: false, favorite: false, overview: 'b', posterPath: '/b.jpg' },
];

const cardFor = (title) => screen.getByText(title).closest('.movieCard');
const viewedBox = (title) => within(cardFor(title)).getByLabelText(/viewed/i);

async function renderList(movies = MOVIES) {
    api.me.mockResolvedValue({ user: { id: '1', userName: 'alice' } });
    api.getUserData.mockResolvedValue({ movieData: movies.map((m) => ({ ...m })) });
    api.saveMovieData.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

    render(
        <MemoryRouter>
            <AuthProvider><MovieCards /></AuthProvider>
        </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Citizen Kane')).toBeInTheDocument());
}

describe('MovieCards', () => {
    beforeEach(() => {
        Object.values(api).forEach((fn) => fn.mockReset());
    });

    it('renders what the server returned', async () => {
        await renderList();
        expect(screen.getByText('The Godfather')).toBeInTheDocument();
        expect(document.querySelectorAll('.movieCard')).toHaveLength(2);
    });

    it('keeps a ticked box ticked, and saves it', async () => {
        await renderList();
        await userEvent.click(viewedBox('Citizen Kane'));

        // The original bug: state was mutated in place and handed back by the
        // same reference, so React never re-rendered and only the browser's
        // own handling made the box look ticked.
        await waitFor(() => expect(viewedBox('Citizen Kane')).toBeChecked());
        expect(viewedBox('The Godfather')).not.toBeChecked();

        const saved = api.saveMovieData.mock.calls.at(-1)[0];
        expect(saved.find((m) => m.imdbId === 'tt1').checked).toBe(true);
        expect(saved.find((m) => m.imdbId === 'tt2').checked).toBe(false);
    });

    it('does not mutate the objects the server handed it', async () => {
        // Deliberately not going through renderList, which copies. The
        // component has to receive these exact objects for this to mean
        // anything.
        const fromServer = MOVIES.map((m) => ({ ...m }));
        api.me.mockResolvedValue({ user: { id: '1', userName: 'alice' } });
        api.getUserData.mockResolvedValue({ movieData: fromServer });
        api.saveMovieData.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

        render(
            <MemoryRouter>
                <AuthProvider><MovieCards /></AuthProvider>
            </MemoryRouter>
        );
        await waitFor(() => expect(screen.getByText('Citizen Kane')).toBeInTheDocument());

        await userEvent.click(viewedBox('Citizen Kane'));
        await waitFor(() => expect(api.saveMovieData).toHaveBeenCalled());

        expect(fromServer[0].checked).toBe(false);
        expect(fromServer).toHaveLength(2);
    });

    it('removes a deleted card and saves the shorter list', async () => {
        await renderList();
        await userEvent.click(within(cardFor('Citizen Kane')).getByRole('button', { name: /delete/i }));

        await waitFor(() => expect(screen.queryByText('Citizen Kane')).not.toBeInTheDocument());
        expect(screen.getByText('The Godfather')).toBeInTheDocument();
        expect(api.saveMovieData.mock.calls.at(-1)[0]).toHaveLength(1);
    });

    it('resets by asking the server, not by uploading a list', async () => {
        await renderList();
        api.resetMovieData.mockResolvedValue({ movieData: MOVIES.map((m) => ({ ...m })) });

        await userEvent.click(viewedBox('Citizen Kane'));
        await waitFor(() => expect(viewedBox('Citizen Kane')).toBeChecked());

        api.saveMovieData.mockClear();
        await userEvent.click(screen.getByRole('button', { name: /reset list/i }));

        await waitFor(() => expect(viewedBox('Citizen Kane')).not.toBeChecked());
        expect(api.resetMovieData).toHaveBeenCalledTimes(1);
        expect(api.saveMovieData).not.toHaveBeenCalled();
    });

    it('shows a failed save rather than pretending it worked', async () => {
        await renderList();
        api.saveMovieData.mockRejectedValue(Object.assign(new Error('Could not save changes (500)'), { status: 500 }));

        await userEvent.click(viewedBox('Citizen Kane'));
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Could not save changes (500)'));
    });

    it('signs the user out when the session has expired', async () => {
        await renderList();
        api.logout.mockResolvedValue(undefined);
        api.saveMovieData.mockRejectedValue(Object.assign(new Error('Not signed in'), { status: 401 }));

        await userEvent.click(viewedBox('Citizen Kane'));

        // A 401 means the list can no longer be saved, so the session is
        // dropped instead of leaving an unsavable page on screen.
        await waitFor(() => expect(api.logout).toHaveBeenCalled());
    });
});
