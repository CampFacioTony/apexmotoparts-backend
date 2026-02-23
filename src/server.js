require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`🔥 Servidor modular de ApexMotoParts corriendo en http://localhost:${PORT}`);
});