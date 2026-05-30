const API_URL = "http://127.0.0.1:8082/api"; 


async function authFetch(endpoint, options = {}) {
    let headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    const fetchOptions = {
        ...options,
        headers,
        credentials: 'include' 
    };

    let response = await fetch(`${API_URL}${endpoint}`, fetchOptions);

    if (response.status === 401) {
        try {
            // Încercăm să chemăm ruta de refresh pe fundal
            const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include' 
            });

            if (refreshResponse.ok) {
                response = await fetch(`${API_URL}${endpoint}`, fetchOptions);
            } else {
                window.location.href = 'login.html';
            }
        } catch (err) {
            console.error("Eroare la reîmprospătarea sesiunii:", err);
            window.location.href = 'login.html';
        }
    }

    return response;
}

const NuclearAPI = {
    async getReactors() {
        try {
            const response = await authFetch('/reactors', { method: 'GET' });
            
            if (response.status === 401) return []; // Dacă tot e 401 după refresh, ne oprim.
            if (!response.ok) throw new Error("Eroare la preluarea reactoarelor");
            
            const data = await response.json();
            return data.data || data || []; 
            
        } catch (error) {
            console.error("API Error:", error);
            return [];
        }
    },

    async getSensorData(reactorId) {
        try {
            const response = await authFetch(`/sensors?reactor_id=${reactorId}`, { method: 'GET' });
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            return null;
        }
    },

    async createReactor(reactorData) {
        try {
            const response = await authFetch('/reactors', {
                method: 'POST',
                body: JSON.stringify(reactorData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Eroare de la Backend:", errorText);
                throw new Error(`HTTP Error: ${response.status}`);
            }
            return true;
        } catch (error) {
            console.error("Eroare la creare API:", error);
            return false;
        }
    }
};

window.authFetch = authFetch;
window.NuclearAPI = NuclearAPI;