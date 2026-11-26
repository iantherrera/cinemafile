import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";

export default function LogoutButton() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [busy, setBusy] = useState(false);

    async function handleClick() {
        if (busy) return;
        setBusy(true);
        await logout();
        navigate("/login", { replace: true });
    }

    return (
        <button className="navButton" id="LogoutButton" type="button"
            onClick={handleClick}
            disabled={busy}
        >
            {busy ? "Signing out..." : "Logout"}
        </button>
    );
}
