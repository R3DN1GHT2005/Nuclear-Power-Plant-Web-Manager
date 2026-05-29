// Central auth JS: handles login, register and password reset flows
async function postJson(url, body){
    const res = await fetch(url, {method:'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)});
    const json = await res.json().catch(()=>null);
    return {ok: res.ok, status: res.status, body: json};
}

// Login
const loginForm = document.getElementById('loginForm');
if (loginForm){
    loginForm.addEventListener('submit', async function(e){
        e.preventDefault();
        const data = { email: this.email.value, password: this.password.value };
        const r = await postJson('/api/auth/login', data);
        if (r.ok){
            // redirect to dashboard
            window.location.href = 'index.html';
        } else {
            alert(r.body?.error || 'Eroare la autentificare');
        }
    });
}

// Register
const registerForm = document.getElementById('registerForm');
if (registerForm){
    registerForm.addEventListener('submit', async function(e){
        e.preventDefault();
        const payload = {
            email: this.email.value,
            first_name: this.first_name.value,
            last_name: this.last_name.value,
            password: this.password.value,
            password_confirm: this.password_confirm ? this.password_confirm.value : undefined
        };
        if (payload.password !== payload.password_confirm){
            alert('Parolele nu coincid');
            return;
        }
        const r = await postJson('/api/auth/register', payload);
        if (r.ok){
            alert('Înregistrare reușită. Poți să te autentifici.');
            // window.location.href = 'login.html'; // COMENTAT — vezi comentat.md
        } else {
            alert(r.body?.error || 'Eroare la înregistrare');
        }
    });
}

// Forgot / Reset
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
if (step1){
    step1.addEventListener('submit', async function(e){
        e.preventDefault();
        const email = this.email.value;
        const r = await postJson('/api/auth/forgot', {email});
        if (r.ok){
            // If backend returns code for demo, pre-fill it and show step2
            if (r.body && r.body.code){
                document.getElementById('code').value = r.body.code;
            }
            document.getElementById('sentNotice').style.display='block';
            if (step2) step2.style.display='block';
        } else {
            alert(r.body?.error || 'Eroare la trimitere cod');
        }
    });
}

if (step2){
    step2.addEventListener('submit', async function(e){
        e.preventDefault();
        const email = document.getElementById('email').value;
        const code = document.getElementById('code').value;
        const new_password = document.getElementById('new_password').value;
        const new_password_confirm = document.getElementById('new_password_confirm').value;
        if (new_password !== new_password_confirm){ alert('Parolele nu coincid'); return; }
        const r = await postJson('/api/auth/reset', {email, code, new_password});
        if (r.ok){
            alert('Parola schimbată cu succes. Te poți conecta.');
            // window.location.href = 'login.html'; // COMENTAT — vezi comentat.md
        } else {
            alert(r.body?.error || 'Eroare la resetare');
        }
    });
}

// export nothing; just attaches handlers
