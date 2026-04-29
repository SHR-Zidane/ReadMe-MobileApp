async function fetchData() {
    try {
        // Pointe vers le serveur Node.js local avec CORS activé
        const response = await fetch('http://localhost:3001/api/epubs');
        if (!response.ok) {
            throw new Error('Api request failed with status ' + response.status);
        }
        const data = await response.json();
        console.log('Données récupérées:', data);
        return data;
    } catch (error) {
        console.error('Impossible de récupérer les livres:', error);
        throw error;
    }
}

export { fetchData };