const LOGIN_API_URL = (() => {
    if (window.location.hostname && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
        return `${window.location.protocol}//${window.location.hostname}:8082/api`;
    }

    return 'http://127.0.0.1:8082/api';
})();

// Funcția actualizată pentru a suporta Cookie-uri
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

async function fetchWithToken(url) {
    const res = await fetch(url, {
        method: 'GET',
        credentials: 'include'
    });
    const json = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, body: json };
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
            
            const response = await postJson(`${LOGIN_API_URL}/auth/login`, data);
            
            if (response.ok) {
                const userRes = await fetchWithToken(`${LOGIN_API_URL}/auth/me`);
                if (userRes.ok && userRes.body) {
                    const role = userRes.body.role;
                    if (role === 'manager' || role === 'tehnician') {
                        window.location.href = 'station-view.html';
                        return;
                    }
                }
                window.location.href = 'index.html';
            } else {
                alert(response.body?.error || 'Eroare la autentificare');
            }
        });
    }
});