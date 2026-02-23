const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Nos aseguramos de que exista la carpeta física donde viviran las fotos
const uploadDir = path.join(__dirname, '../../uploads/productos');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Le decimos a Multer DÓNDE y CÓMO guardar el archivo
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Guardar en la carpeta que creamos arriba
    },
    filename: function (req, file, cb) {
        // Renombramos la foto para que nunca choquen dos archivos con el mismo nombre
        // Formato: IDdelProducto-NumerosRandom.jpg
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, req.params.id + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// 3. El cadenero de formato: Solo dejamos pasar imágenes reales
const fileFilter = (req, file, cb) => {
    const permitidos = /jpeg|jpg|png|webp/;
    const extname = permitidos.test(path.extname(file.originalname).toLowerCase());
    const mimetype = permitidos.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        // Si intentan subir un PDF o un virus (.exe), lo rebotamos
        cb(new Error('Formato no válido. Solo se permiten imágenes (jpeg, jpg, png, webp)'));
    }
};

const upload = multer({ 
    storage: storage, 
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5 Megabytes por foto
});

module.exports = upload;