/*
 * frontend/public/assets/js/login.js
 * Login page handler — submits email/password via POST /auth/login with
 * cookie-based credentials. On success redirects to dashboard (tehnician
 * /manager) or index (admin). Displays error alerts on failure.
 */
const LOGIN_API_URL = window.FRONTEND_API_URL;



async function postJson(url, body) {
    const res = await fetch(url, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
    });
    const json = await res.json().catch(() => null);
    return { 
        ok: res.ok, 
        status: res.status,
         body: json 
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const data = {
                email: this.email.value,
                password: this.password.value
            };

            const res = await postJson(`${LOGIN_API_URL}/auth/login`, data);

            if (res.ok && res.body && res.body.user) {
                const role = res.body.user.role;
                if (role === 'tehnician' || role === 'manager') {
                    window.location.href = 'dashboard.html';
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                alert(res.body?.error || 'Eroare la autentificare');
            }
        });
    }
});