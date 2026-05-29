
const API_URL = "http://localhost:8082/api"; 

// Funcție utilitară pentru a prelua token-ul din browser
function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '' 
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