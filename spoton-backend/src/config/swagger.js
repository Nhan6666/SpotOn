const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');

module.exports = (app) => {
  const swaggerFile = path.join(__dirname, '../../swagger_output.json');
  
  if (fs.existsSync(swaggerFile)) {
    const swaggerDocument = require(swaggerFile);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'SpotOn API Documentation'
    }));
    console.log('📄 Swagger UI is available at http://localhost:5000/api-docs');
  } else {
    console.log('⚠️ Swagger file not found. Please run "node swagger-autogen.js" first.');
  }
};
