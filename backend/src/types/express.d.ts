import { JwtUser } from '../common/auth/jwt/jwt-user.interface';

declare global {
  namespace Express {
    interface User extends JwtUser {}
    interface Request {
      user: JwtUser;
    }
  }
}
