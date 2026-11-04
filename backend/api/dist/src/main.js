"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const password_redaction_interceptor_1 = require("./common/auth/password-redaction.interceptor");
require("dotenv/config");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const path_1 = require("path");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const csrf_middleware_1 = require("./common/auth/csrf.middleware");
const validation_errors_1 = require("./common/utils/validation-errors");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    app.use((0, cookie_parser_1.default)());
    app.use(csrf_middleware_1.csrfMiddleware);
    const configService = app.get(config_1.ConfigService);
    const corsOrigins = configService.get('CORS_ORIGINS')?.split(',') || [
        'http://localhost:5173',
        'http://localhost:3001',
        'https://www.caapmedia.com',
        'https://caapmedia.com',
    ];
    app.enableCors({
        origin: corsOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        credentials: true,
    });
    app.useGlobalInterceptors(new password_redaction_interceptor_1.PasswordRedactionInterceptor());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
        exceptionFactory: (errors) => {
            const errorMessages = (0, validation_errors_1.formatValidationErrors)(errors);
            return new common_1.BadRequestException({
                message: errorMessages,
                error: 'Validation failed',
                statusCode: 400,
            });
        },
    }));
    app.use(['/public/employee-documents', '/public/uploads/secretariat'], (_req, res) => {
        res.status(404).end();
    });
    app.useStaticAssets((0, path_1.join)(__dirname, '..', '..', 'public'), {
        prefix: '/public',
    });
    app.enableShutdownHooks();
    const staticPath = (0, path_1.join)(__dirname, '..', '..', 'public');
    common_1.Logger.log(`✅ Static files served from: ${staticPath}`, 'Bootstrap');
    app.setGlobalPrefix('api-caapmedia');
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    common_1.Logger.log(`Application running on: https://www.caapmedia.com/api-caapmedia, port:${port}`, 'Bootstrap');
}
bootstrap();
//# sourceMappingURL=main.js.map