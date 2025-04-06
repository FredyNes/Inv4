require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER || 'tu-usuario';
const REPO_NAME = process.env.REPO_NAME || 'tu-repositorio';

// Ruta para guardar datos
app.post('/api/save', async (req, res) => {
    try {
        const { filename, data } = req.body;
        
        // Verificar si el archivo ya existe para obtener su SHA
        let sha = '';
        try {
            const existingFile = await axios.get(
                `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/data/${filename}`,
                {
                    headers: {
                        'Authorization': `token ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            sha = existingFile.data.sha;
        } catch (error) {
            if (error.response.status !== 404) {
                throw error;
            }
        }

        // Crear o actualizar el archivo
        const response = await axios.put(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/data/${filename}`,
            {
                message: `Actualización de ${filename}`,
                content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
                sha: sha
            },
            {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        res.json({
            success: true,
            message: 'Datos guardados en GitHub',
            data: response.data
        });
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Error al guardar datos',
            error: error.response?.data || error.message
        });
    }
});

// Ruta para leer datos
app.get('/api/read/:filename', async (req, res) => {
    try {
        const response = await axios.get(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/data/${req.params.filename}`,
            {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
        res.json({
            success: true,
            data: JSON.parse(content)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al leer datos',
            error: error.response?.data || error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
