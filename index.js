require('dotenv').config(); // Cargar variables de entorno
const express = require('express');
const path = require('path');
const { Pool } = require('pg'); // Cliente de PostgreSQL
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Crear instancia de Express
const app = express();

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'frontend')));

// Middleware básico
app.use(express.json());

// Configurar conexión a PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Conexión a PostgreSQL
pool.connect()
    .then(() => console.log('Conectado a PostgreSQL'))
    .catch((err) => console.error('Error al conectar a PostgreSQL:', err));

// Rutas CRUD para la tabla "items"

// Crear un recurso
app.post('/items', async (req, res) => {
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'El campo "name" es obligatorio.' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO items (name, description) VALUES ($1, $2) RETURNING *',
            [name, description || '']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Leer todos los recursos
app.get('/items', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM items');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Actualizar un recurso
app.put('/items/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'El campo "name" es obligatorio.' });
    }
    try {
        const result = await pool.query(
            'UPDATE items SET name = $1, description = $2 WHERE id = $3 RETURNING *',
            [name, description || '', id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Eliminar un recurso
app.delete('/items/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM items WHERE id = $1', [id]);
        res.json({ message: 'Recurso eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rutas de autenticación

// Registro
app.post('/auth/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Se requieren "username" y "password".' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
            [username, hashedPassword]
        );
        res.status(201).json({ message: 'Usuario registrado', user: result.rows[0] });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Inicio de sesión
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Se requieren "username" y "password".' });
    }
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta protegida
app.get('/api/protected', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Acceso denegado' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ message: 'Acceso permitido', userId: verified.id });
    } catch (err) {
        res.status(401).json({ error: 'Token inválido' });
    }
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Ocurrió un error inesperado' });
});

// Ruta principal
app.get('/', (req, res) => {
    res.send('¡Servidor funcionando correctamente!');
});

// Configuración del puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
