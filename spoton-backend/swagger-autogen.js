const swaggerAutogen = require('swagger-autogen')();
const fs = require('fs');
const path = require('path');

const doc = {
  info: {
    title: 'SpotOn API',
    description: 'API documentation for SpotOn Restaurant Management System',
    version: '1.0.0'
  },
  host: 'localhost:5000',
  basePath: '/',
  schemes: ['http'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'Enter your Bearer token in the format **Bearer &lt;token>**'
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

const outputFile = './swagger_output.json';
const routes = ['./src/server.js'];

function normalizePath(p) {
  let normalized = p.trim().replace(/:([^\/]+)/g, '{$1}');
  if (normalized.endsWith('/') && normalized !== '/') {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

swaggerAutogen(outputFile, routes, doc).then(() => {
  const data = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
  const routeDescriptions = {};

  // 1. Quét src/controllers (@desc và @route)
  const controllersDir = path.join(__dirname, 'src', 'controllers');
  if (fs.existsSync(controllersDir)) {
    fs.readdirSync(controllersDir).forEach(file => {
      if (file.endsWith('.js')) {
        const content = fs.readFileSync(path.join(controllersDir, file), 'utf8');
        const regex = /\/\/\s*@desc\s+(.+)\r?\n\/\/\s*@route\s+(GET|POST|PUT|DELETE|PATCH)\s+(\S+)/gi;
        let match;
        while ((match = regex.exec(content)) !== null) {
          let desc = match[1].trim();
          let method = match[2].toLowerCase();
          let swaggerPath = normalizePath(match[3]);
          
          if (!routeDescriptions[swaggerPath]) routeDescriptions[swaggerPath] = {};
          routeDescriptions[swaggerPath][method] = desc;
        }
      }
    });
  }

  // 2. Quét src/routes (-> description)
  const routesDir = path.join(__dirname, 'src', 'routes');
  if (fs.existsSync(routesDir)) {
    fs.readdirSync(routesDir).forEach(file => {
      if (file.endsWith('.js')) {
        const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
        const regex = /\/\/\s*(GET|POST|PUT|DELETE|PATCH)\s+(\S+)\s*->\s*(.+)/gi;
        let match;
        while ((match = regex.exec(content)) !== null) {
          let method = match[1].toLowerCase();
          let swaggerPath = normalizePath(match[2]);
          let desc = match[3].trim();
          
          if (!routeDescriptions[swaggerPath]) routeDescriptions[swaggerPath] = {};
          // Prefer route comments if not already set by controller
          if (!routeDescriptions[swaggerPath][method]) {
            routeDescriptions[swaggerPath][method] = desc;
          }
        }
      }
    });
  }

  let totalApis = 0;
  const tagsSet = new Set();
  
  // 3. Map tags và descriptions
  Object.keys(data.paths).forEach(swaggerPath => {
    Object.keys(data.paths[swaggerPath]).forEach(method => {
      totalApis++;
      const endpoint = data.paths[swaggerPath][method];
      
      const parts = swaggerPath.split('/');
      let tag = 'Default';
      if (parts.length >= 4 && parts[1] === 'api' && parts[2] === 'v1') {
        const resource = parts[3];
        tag = resource.charAt(0).toUpperCase() + resource.slice(1);
      }
      endpoint.tags = [tag];
      tagsSet.add(tag);
      
      const normPath = normalizePath(swaggerPath);
      if (routeDescriptions[normPath] && routeDescriptions[normPath][method]) {
        endpoint.summary = routeDescriptions[normPath][method];
      }
    });
  });
  
  // Hardcode missing summaries
  const hardcodedSummaries = {
    '/api/v1/health': { get: 'Kiểm tra trạng thái hệ thống' },
    '/api/v1/branches': { get: 'Lấy danh sách chi nhánh', post: 'Tạo chi nhánh mới' },
    '/api/v1/branches/{branchId}/zones': { get: 'Lấy danh sách khu vực', post: 'Tạo khu vực mới' },
    '/api/v1/branches/{branchId}/zones/{zoneId}': { put: 'Cập nhật khu vực' },
    '/api/v1/branches/{branchId}/zones/{zoneId}/apply-template': { post: 'Áp dụng sơ đồ mẫu vào khu vực' },
    '/api/v1/branches/{branchId}/zones/{zoneId}/tables': { post: 'Thêm bàn vào khu vực' },
    '/api/v1/users/profile': { get: 'Lấy thông tin cá nhân', put: 'Cập nhật thông tin cá nhân' },
    '/api/v1/users/managers': { get: 'Lấy danh sách quản lý' },
    '/api/v1/categories': { get: 'Lấy danh sách danh mục', post: 'Tạo danh mục mới' },
    '/api/v1/uploads/refund': { post: 'Upload ảnh hoàn tiền' },
    '/api/v1/map-templates': { get: 'Lấy danh sách sơ đồ mẫu', post: 'Tạo sơ đồ mẫu' },
    '/api/v1/map-templates/{id}': { get: 'Lấy chi tiết sơ đồ mẫu', put: 'Cập nhật sơ đồ mẫu', delete: 'Xóa sơ đồ mẫu' },
    '/api/v1/map-templates/{id}/zones': { get: 'Lấy danh sách khu vực trong sơ đồ mẫu', post: 'Thêm khu vực vào sơ đồ mẫu' },
    '/api/v1/map-templates/{id}/zones/{zoneId}': { put: 'Cập nhật khu vực', delete: 'Xóa khu vực' },
    '/api/v1/map-templates/{id}/zones/{zoneId}/tables': { post: 'Thêm bàn' },
    '/api/v1/map-templates/{id}/zones/{zoneId}/tables/layout': { put: 'Cập nhật vị trí các bàn' },
    '/api/v1/map-templates/{id}/zones/{zoneId}/tables/{tableId}': { put: 'Cập nhật thông tin bàn', delete: 'Xóa bàn' }
  };

  Object.keys(data.paths).forEach(swaggerPath => {
    const normPath = normalizePath(swaggerPath);
    if (hardcodedSummaries[normPath]) {
      Object.keys(data.paths[swaggerPath]).forEach(method => {
        if (!data.paths[swaggerPath][method].summary && hardcodedSummaries[normPath][method]) {
          data.paths[swaggerPath][method].summary = hardcodedSummaries[normPath][method];
        }
      });
    }
  });

  // 4. Update metadata
  data.info.title = `SpotOn API (Total: ${totalApis} APIs)`;
  data.info.description = `### 📊 Báo cáo API\n- **Tổng số lượng API:** \`${totalApis}\`\n\n` + data.info.description;
  data.tags = Array.from(tagsSet).sort().map(name => ({ name }));
  
  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
  console.log(`Swagger documentation generated successfully with ${totalApis} APIs and Vietnamese descriptions!`);
});
