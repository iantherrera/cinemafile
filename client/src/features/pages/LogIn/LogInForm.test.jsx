import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LoginForm from './LogInForm';
import { AuthProvider } from '../../auth/AuthContext';
import { api } from '../../auth/api';

vi.mock('../../auth/api', () => ({
    api: { me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn() },
}));

async function renderForm() {
    api.me.mockRejectedValue(Object.assign(new Error('Not signed in'), { status: 401 }));
    render(
        <MemoryRouter>
            <AuthProvider><LoginForm /></AuthProvider>
        </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByLabelText(/username/i)).toBeInTheDocument());
}

const submit = async (userName, password) => {
    await userEvent.type(screen.getByLabelText(/username/i), userName);
    await userEvent.type(screen.getByLabelText(/password/i), password);
    await userEvent.click(screen.getByRole('button', { name: /^login$/i }));
};

describe('LoginForm', () => {
    beforeEach(() => {
        api.me.mockReset();
        api.login.mockReset();
    });

    it('sends what was typed', async () => {
        api.login.mockResolvedValue({ user: { id: '1', userName: 'alice' } });
        await renderForm();
        await submit('alice', 'a good password');

        await waitFor(() => expect(api.login).toHaveBeenCalledWith('alice', 'a good password'));
    });

    it("shows the server's reason for refusing", async () => {
        api.login.mockRejectedValue(Object.assign(new Error('Incorrect username or password'), { status: 401 }));
        await renderForm();
        await submit('alice', 'wrong');

        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Incorrect username or password'));
    });

    it('re-enables the button after a failure so the user can try again', async () => {
        api.login.mockRejectedValue(new Error('Incorrect username or password'));
        await renderForm();
        await submit('alice', 'wrong');

        await waitFor(() => expect(screen.getByRole('button', { name: /^login$/i })).toBeEnabled());
    });

    it('does not submit twice while a request is in flight', async () => {
        let resolveLogin;
        api.login.mockReturnValue(new Promise((resolve) => { resolveLogin = resolve; }));
        await renderForm();
        await submit('alice', 'a good password');

        const button = screen.getByRole('button', { name: /signing in/i });
        expect(button).toBeDisabled();
        await userEvent.click(button);
        expect(api.login).toHaveBeenCalledTimes(1);

        resolveLogin({ user: { id: '1', userName: 'alice' } });
    });
});
