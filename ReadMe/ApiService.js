async function fetchData() {
    try {
        const response = await fetch('http://127.0.0.1:3000/books');
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