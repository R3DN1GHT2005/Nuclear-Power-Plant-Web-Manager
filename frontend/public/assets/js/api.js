/*
 * frontend/public/assets/js/api.js
 * API client — base URL, auth fetch wrapper with refresh-token rotation,
 * and NuclearAPI object exposing all backend endpoints (reactors, sensors,
 * alerts, users, auth, RSS, management, reports). Central HTTP layer for
 * the entire frontend. Automatically redirects to login on 401 after
 * a failed token refresh attempt.
 */
const API_URL = (() => {
    if (window.location.hostname && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
        return `${window.location.protocol}//${window.location.hostname}:8082/api`;
    }

    return 'http://127.0.0.1:8082/api';
})();

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
            
            if (response.status === 401) return []; 

            if (!response.ok) throw new Error("Eroare la preluarea reactoarelor");
            
            const data = await response.json();
            return data.data || data || []; 
            
        } catch (error) {
            console.error("API Error (getReactors):", error);
            return [];
        }
    },

    async createReactor(reactorData) {
        const response = await authFetch('/reactors', {
            method: 'POST',
            body: JSON.stringify(reactorData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP Error: ${response.status}`);
        }
        return true;
    },

    async updateReactor(reactorId, reactorData) {
        const response = await authFetch(`/reactors/${reactorId}`, {
            method: 'PUT',
            body: JSON.stringify(reactorData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP Error: ${response.status}`);
        }
        return true;
    },

    async updateReactorStatus(reactorId, status) {
        const response = await authFetch(`/reactors/${reactorId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP Error: ${response.status}`);
        }

        return await response.json();
    },

    

    

    


    async getKpi() {
        const response = await authFetch('/reports/kpi', { method: 'GET' });
        if (!response.ok) throw new Error('Eroare la preluarea KPI-urilor');
        return await response.json();
    },

    async getEfficiencyPerReactor() {
        const response = await authFetch('/reports/efficiency', { method: 'GET' });
        if (!response.ok) throw new Error('Eroare la preluarea eficienței per reactor');
        return await response.json();
    },

    async getEfficiencyTrend(days = 30) {
        const response = await authFetch(`/reports/efficiency/trend?days=${encodeURIComponent(days)}`, { method: 'GET' });
        if (!response.ok) throw new Error('Eroare la preluarea trendului de eficiență');
        return await response.json();
    },

    async getComparison() {
        const response = await authFetch('/reports/comparison', { method: 'GET' });
        if (!response.ok) throw new Error('Eroare la preluarea comparației');
        return await response.json();
    },

    async getRiskMatrix() {
        const response = await authFetch('/reports/risk-matrix', { method: 'GET' });
        if (!response.ok) throw new Error('Eroare la preluarea matricei de risc');
        return await response.json();
    },

    async getWear() {
        const response = await authFetch('/reports/wear', { method: 'GET' });
        if (!response.ok) throw new Error('Eroare la preluarea uzurii');
        return await response.json();
    },

    

    

    


    

    async getSensorTypes() {
        try {
            const response = await authFetch('/sensors/types', { method: 'GET' });
            if (!response.ok) throw new Error("Eroare la preluarea tipurilor de senzori");
            return await response.json();
        } catch (error) {
            console.error("API Error (getSensorTypes):", error);
            return {};
        }
    },

    

    async getSensorsByReactor(reactorId) {
        try {
            const response = await authFetch(`/reactors/${reactorId}/sensors`, { method: 'GET' });
            if (!response.ok) throw new Error("Eroare la preluarea senzorilor");
            
            const payload = await response.json();
            return Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : [];
        } catch (error) {
            console.error("API Error (getSensorsByReactor):", error);
            return [];
        }
    },

    

    async addSensorToReactor(reactorId, sensorData) {
        const response = await authFetch(`/reactors/${reactorId}/sensors`, {
            method: 'POST',
            body: JSON.stringify(sensorData)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Eroare la adăugarea senzorului");
        }
        return await response.json(); 

    },

    

    async updateSensor(sensorId, sensorData) {
        const response = await authFetch(`/sensors/${sensorId}`, {
            method: 'PATCH',
            body: JSON.stringify(sensorData)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Eroare la actualizarea senzorului");
        }
        return true;
    },

    

    async deleteSensor(sensorId) {
        const response = await authFetch(`/sensors/${sensorId}`, { method: 'DELETE' });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Eroare la ștergerea senzorului");
        }
        return true;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await authFetch('/auth/logout', { method: 'POST' });
            } catch (e) {}
            window.location.href = 'login.html';
        });
    }
});



window.authFetch = authFetch;
window.NuclearAPI = NuclearAPI;