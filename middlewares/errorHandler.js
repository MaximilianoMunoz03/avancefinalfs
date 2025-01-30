module.exports = (err, req, res, next) => {
    console.error(err.stack); // Mostrar el error en la consola
    res.status(500).json({ error: 'Ocurrió un error inesperado' }); // Enviar respuesta genérica
};
