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
        me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn(),
        getUserData: vi.fn(), saveMovieData: vi.fn(), resetMovieData: vi.fn(),
    },
}));

const MOVIES = [
    { imdbId: 'tt1', rank: '1', movieTitle: 'Citizen Kane', year: '1941', checked: false, favorite: false, overview: 'a', posterPath: '/a.jpg' },
    { imdbId: 'tt2', rank: '2', movieTitle: 'The Godfather', year: '1972', checked: false, favorite: false, overview: 'b', posterPath: '/b.jpg' },
];

const cardFor = (t) => screen.getByText(t).closest('.movieCard');
const viewedBox = (t) => within(cardFor(t)).getByLabelText(/viewed/i);

describe('concurrent saves', () => {
    beforeEach(() => {
        Object.values(api).forEach((fn) => fn.mockReset());
        api.me.mockResolvedValue({ user: { id: '1', userName: 'alice' } });
        api.getUserData.mockResolvedValue({ movieData: MOVIES.map((m) => ({ ...m })) });
    });

    it('does not let an earlier save land after a later one', async () => {
        // The first save is held open while the second is made, then released
        // last. Without sequencing both are in flight at once and the server
        // is left holding whichever reply it happens to process second --
        // here, the older list, silently losing the second edit.
        const inFlight = [];
        api.saveMovieData.mockImplementation((list) => new Promise((resolve) => {
            inFlight.push({ list, resolve });
        }));

        render(
            <MemoryRouter><AuthProvider><MovieCards /></AuthProvider></MemoryRouter>
        );
        await waitFor(() => expect(screen.getByText('Citizen Kane')).toBeInTheDocument());

        await userEvent.click(viewedBox('Citizen Kane'));
        await waitFor(() => expect(inFlight).toHaveLength(1));

        await userEvent.click(viewedBox('The Godfather'));

        // With fire-and-forget both requests exist already. With sequencing
        // the second waits for the first to settle, so only one is open.
        expect(inFlight).toHaveLength(1);

        inFlight[0].resolve({ matchedCount: 1, modifiedCount: 1 });
        await waitFor(() => expect(inFlight).toHaveLength(2));
        inFlight[1].resolve({ matchedCount: 1, modifiedCount: 1 });

        // Whatever the server saw last must carry both edits.
        await waitFor(() => {
            const last = inFlight.at(-1).list;
            expect(last.find((m) => m.imdbId === 'tt1').checked).toBe(true);
            expect(last.find((m) => m.imdbId === 'tt2').checked).toBe(true);
        });
    });
});
