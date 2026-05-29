// frontend/assets/js/api.js

const API_URL = "http://localhost:8082/api"; // Atenție la port! Backend-ul tău e pe 8082

// Funcție utilitară pentru a prelua token-ul din browser
function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '' // Atașăm token-ul aici!
    };
}

const NuclearAPI = {
    async getReactors() {
        try {
            const response = await fetch(`${API_URL}/reactors`, {
                method: 'GET',
                headers: getAuthHeaders() // Folosim headerele cu token
            });
            
            if (response.status === 401) {
                // Dacă token-ul a expirat, îl trimitem pe utilizator înapoi la logare
                window.location.href = 'login.html';
                return [];
            }
            
            if (!response.ok) 
                throw new Error("Eroare la preluarea reactoarelor");
                
            const data = await response.json();
            
            // Backend-ul tău PHP s-ar putea să returneze { success: true, data: [...] }
            // Verificăm dacă vectorul este în interiorul cheii "data"
            return data.data || data || []; 
            
        } catch (error) {
            console.error("API Error:", error);
            return [];
        }
    },

    async getSensorData(reactorId) {
        try {
            const response = await fetch(`${API_URL}/sensors?reactor_id=${reactorId}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            return null;
        }
    },

    async createReactor(reactorData) {
        try {
            const response = await fetch(`${API_URL}/reactors`, {
                method: 'POST',
                headers: getAuthHeaders(),
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