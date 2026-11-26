import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import RegistrationForm from './Registration';
import { AuthProvider } from '../../auth/AuthContext';
import { api } from '../../auth/api';

vi.mock('../../auth/api', () => ({
    api: { me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn() },
}));

async function renderForm() {
    api.me.mockRejectedValue(Object.assign(new Error('Not signed in'), { status: 401 }));
    render(
        <MemoryRouter>
            <AuthProvider><RegistrationForm /></AuthProvider>
        </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByLabelText(/username/i)).toBeInTheDocument());
}

const submit = async (userName, password, confirm) => {
    await userEvent.type(screen.getByLabelText(/username/i), userName);
    await userEvent.type(screen.getByLabelText(/^password:/i), password);
    await userEvent.type(screen.getByLabelText(/confirm password/i), confirm);
    await userEvent.click(screen.getByRole('button', { name: /^register$/i }));
};

describe('RegistrationForm', () => {
    beforeEach(() => {
        api.me.mockReset();
        api.register.mockReset();
    });

    it('creates the account', async () => {
        api.register.mockResolvedValue({ user: { id: '1', userName: 'alice' } });
        await renderForm();
        await submit('alice', 'a good password', 'a good password');

        await waitFor(() => expect(api.register).toHaveBeenCalledWith('alice', 'a good password'));
    });

    it('rejects mismatched passwords without troubling the server', async () => {
        await renderForm();
        await submit('alice', 'a good password', 'a different password');

        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/do not match/i));
        expect(api.register).not.toHaveBeenCalled();
    });

    it('rejects a short password without troubling the server', async () => {
        await renderForm();
        await submit('alice', 'short', 'short');

        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/at least 8/i));
        expect(api.register).not.toHaveBeenCalled();
    });

    it('surfaces a username already taken', async () => {
        api.register.mockRejectedValue(Object.assign(new Error('That username is taken'), { status: 409 }));
        await renderForm();
        await submit('alice', 'a good password', 'a good password');

        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('That username is taken'));
    });
});
