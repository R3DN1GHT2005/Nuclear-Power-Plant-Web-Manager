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
    }
};