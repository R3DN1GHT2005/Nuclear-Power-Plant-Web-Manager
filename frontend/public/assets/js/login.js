async function postJson(url, body) {
    const res = await fetch(url, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
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
            
            const response = await postJson('http://localhost:8082/api/auth/login', data);
            
            if (response.ok) {
                if (response.body && response.body.access_token) {
                    localStorage.setItem('access_token', response.body.access_token);
                }
                
                
                window.location.href = 'index.html'; 
            } else {
                alert(response.body?.error || 'Eroare la autentificare');
            }
        });
    }
});