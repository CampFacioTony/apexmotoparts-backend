const express = require('express');
const cors = require('cors');
const path = require('path');

const productosRoutes = require('./routes/productos.routes');
const vehiculosRoutes = require('./routes/vehiculos.routes'); 
const compatibilidadRoutes = require('./routes/compatibilidad.routes');
const almacenRoutes = require('./routes/almacen.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const ventasRoutes = require('./routes/ventas.routes');
const reportesRoutes = require('./routes/reportes.routes');


const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: '¡El cerebro modular está vivo!' });
});

// NUEVO: Le decimos a Express que la carpeta uploads es una "vitrina pública"
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/productos', productosRoutes);
app.use('/api/vehiculos', vehiculosRoutes); 
app.use('/api/compatibilidad', compatibilidadRoutes); 
app.use('/api/almacen', almacenRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/reportes', reportesRoutes);


module.exports = app;