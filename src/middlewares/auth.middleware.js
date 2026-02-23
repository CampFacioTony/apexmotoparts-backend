const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    // 1. Buscamos el token en la cabecera de la petición
    const authHeader = req.headers['authorization'];
    
    // El formato estándar es "Bearer eyJhbGci...", así que lo separamos
    const token = authHeader && authHeader.split(' ')[1]; 

    // Si no trae gafete, le cerramos la puerta
    if (!token) {
        return res.status(403).json({ 
            status: 'error', 
            message: 'Acceso denegado. Necesitas iniciar sesión primero.' 
        });
    }

    try {
        // 2. Verificamos que el token sea original (usando tu firma secreta)
        const decodificado = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Si es válido, guardamos los datos del usuario y lo dejamos pasar
        req.usuario = decodificado;
        next();
    } catch (error) {
        return res.status(401).json({ 
            status: 'error', 
            message: 'Tu sesión ha expirado o el token es inválido. Vuelve a iniciar sesión.' 
        });
    }
};

module.exports = { verificarToken };