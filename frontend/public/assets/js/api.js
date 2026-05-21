// frontend/assets/js/api.js

const API_URL = "http://localhost:8083/api";

const NuclearAPI = {
    async getReactors() {
        try {
            const response = await fetch(`${API_URL}/reactors`);
            if (!response.ok) 
                throw new Error("Eroare la preluarea reactoarelor");
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            return [];
        }
    },

    async getSensorData(reactorId) {
       
        const response = await fetch(`${API_URL}/sensors?reactor_id=${reactorId}`);
        return await response.json();
    },

    async createReactor(reactorData) {
        try {
            const response = await fetch(`${API_URL}/reactors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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