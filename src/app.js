const express = require('express');
const cors = require('cors');
const productosRoutes = require('./routes/productos.routes');
const vehiculosRoutes = require('./routes/vehiculos.routes'); 
const compatibilidadRoutes = require('./routes/compatibilidad.routes');
const almacenRoutes = require('./routes/almacen.routes');
const usuariosRoutes = require('./routes/usuarios.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: '¡El cerebro modular está vivo!' });
});

app.use('/api/productos', productosRoutes);
app.use('/api/vehiculos', vehiculosRoutes); 
app.use('/api/compatibilidad', compatibilidadRoutes); 
app.use('/api/almacen', almacenRoutes);
app.use('/api/usuarios', usuariosRoutes);

module.exports = app;