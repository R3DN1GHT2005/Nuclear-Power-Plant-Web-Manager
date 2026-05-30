// Funcția actualizată pentru a suporta Cookie-uri
async function postJson(url, body) {
    const res = await fetch(url, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // CRITIC: Fără asta, browserul refuză cookie-urile setate de server!
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
            
            // MODIFICAREA ESTE AICI: Folosește 127.0.0.1 în loc de localhost
            const response = await postJson('http://127.0.0.1:8082/api/auth/login', data);
            
            if (response.ok) {
                window.location.href = 'index.html'; 
            } else {
                alert(response.body?.error || 'Eroare la autentificare');
            }
        });
    }
});