import jwt from "jsonwebtoken";
import { expressjwt } from "express-jwt";
import jwksRsa from "jwks-rsa";
import User from "../models/user.model.js";

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || "dev-jualdgdxsldqmwm3.us.auth0.com";
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || "https://job-platform.api";
const JWT_SECRET = process.env.JWT_KEY || "your_jwt_secret";
const TOKEN_EXPIRY = '24h'; // Token expires in 24 hours

console.log('Auth Configuration:', {
  auth0Domain: AUTH0_DOMAIN,
  auth0Audience: AUTH0_AUDIENCE,
  hasJwtSecret: !!JWT_SECRET
});

const auth0JwtCheck = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience: AUTH0_AUDIENCE,
  issuer: `https://${AUTH0_DOMAIN}/`,
  algorithms: ["RS256"],
  requestProperty: "auth0User",
  credentialsRequired: false,
});

export const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id, 
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
};

export const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  console.log('Authenticating request:', {
    hasAuthHeader: !!authHeader,
    authHeaderPrefix: authHeader ? authHeader.substring(0, 20) + '...' : null,
    method: req.method,
    path: req.path,
    headers: req.headers
  });

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log('Missing or malformed token');
    return res.status(401).json({ 
      error: "Unauthorized", 
      message: "Missing or malformed token",
      code: "TOKEN_MISSING"
    });
  }

  const token = authHeader.split(" ")[1];

  // Try to decode the token without verification to check its structure
  try {
    const decodedHeader = jwt.decode(token, { complete: true });
    console.log('Decoded token header:', {
      header: decodedHeader?.header,
      issuer: decodedHeader?.payload?.iss,
      audience: decodedHeader?.payload?.aud,
      subject: decodedHeader?.payload?.sub
    });
    
    // Check if it's an Auth0 token (has specific properties)
    const isAuth0Token = decodedHeader?.header?.kid && 
                        decodedHeader?.payload?.iss?.includes(AUTH0_DOMAIN);

    console.log('Token type check:', {
      isAuth0Token,
      auth0Domain: AUTH0_DOMAIN,
      tokenIssuer: decodedHeader?.payload?.iss
    });

    if (isAuth0Token) {
      // Handle Auth0 token
      return auth0JwtCheck(req, res, async (auth0Error) => {
        console.log('Auth0 verification result:', {
          hasError: !!auth0Error,
          errorMessage: auth0Error?.message,
          auth0User: req.auth0User
        });

        if (!auth0Error && req.auth0User) {
          try {
            // Extract email from Auth0 token
            const email = req.auth0User?.email || 
                         req.auth0User?.['https://your-auth0-domain/email'] ||
                         req.auth0User?.['https://job-platform.api/email'] ||
                         req.auth0User?.['https://dev-jualdgdxsldqmwm3.us.auth0.com/email'];

            console.log('Email extraction:', {
              directEmail: req.auth0User?.email,
              namespaceEmail: req.auth0User?.['https://job-platform.api/email'],
              finalEmail: email
            });

            let userEmail = email;
            
            if (!userEmail && req.auth0User?.sub?.startsWith('google-oauth2|')) {
              try {
                userEmail = await getUserInfoFromAuth0(token);
                console.log('Got email from userinfo endpoint:', userEmail);
              } catch (error) {
                console.error('Error fetching user info:', error);
              }
            }

            if (!userEmail) {
              console.error('No email found in Auth0 token');
              return res.status(401).json({ 
                error: "Invalid token",
                message: "No email found in token. Please log in again.",
                code: "EMAIL_MISSING"
              });
            }

            // Get user role from database
            const dbUser = await User.findOne({ email: userEmail });
            console.log('Database user lookup:', {
              email: userEmail,
              found: !!dbUser,
              role: dbUser?.role
            });
            
            if (!dbUser) {
              console.error('User not found in database:', userEmail);
              return res.status(401).json({ 
                error: "Unauthorized",
                message: "User not found. Please log in again.",
                code: "USER_NOT_FOUND"
              });
            }

            req.user = {
              email: userEmail,
              role: dbUser.role,
              ...req.auth0User
            };
            
            console.log('Auth0 authentication successful:', {
              email: req.user.email,
              role: req.user.role,
              sub: req.user.sub
            });
            
            // Check if route requires recruiter role
            if (req.path.includes('/api/applications/recruiter') && dbUser.role !== 'recruiter') {
              console.error('Access denied: User is not a recruiter');
              return res.status(403).json({ 
                error: "Forbidden",
                message: "Access denied. Only recruiters can access this resource.",
                code: "ROLE_FORBIDDEN"
              });
            }
            
            return next();
          } catch (error) {
            console.error('Error processing Auth0 token:', error);
            return res.status(401).json({ 
              error: "Authentication failed",
              message: "Error processing authentication. Please try again.",
              code: "AUTH_PROCESSING_ERROR"
            });
          }
        }

        console.error('Auth0 token verification failed:', auth0Error);
        return res.status(401).json({ 
          error: "Authentication failed",
          message: "Invalid Auth0 token. Please log in again.",
          code: "AUTH0_FAILED"
        });
      });
    }

    // Handle regular JWT token
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Check if token is about to expire (less than 1 hour remaining)
      const tokenExp = decoded.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      if (tokenExp - now < oneHour) {
        // Generate a new token
        const newToken = generateToken({ 
          _id: decoded.userId, 
          email: decoded.email,
          role: decoded.role
        });
        
        // Add the new token to the response headers
        res.setHeader('X-New-Token', newToken);
      }
      
      // Get latest user data from database
      const dbUser = await User.findOne({ email: decoded.email });
      if (!dbUser) {
        console.error('User not found in database:', decoded.email);
        return res.status(401).json({ 
          error: "Unauthorized",
          message: "User not found. Please log in again.",
          code: "USER_NOT_FOUND"
        });
      }

      // Use the latest role from database
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: dbUser.role // Use role from database instead of token
      };
      
      console.log('Regular JWT verification successful:', {
        email: req.user.email,
        userId: req.user.userId,
        role: req.user.role,
        exp: new Date(decoded.exp * 1000).toISOString()
      });
      
      return next();
    } catch (jwtError) {
      console.error('Regular JWT verification failed:', {
        name: jwtError.name,
        message: jwtError.message,
        expiredAt: jwtError.expiredAt
      });

      return res.status(401).json({
        error: "Token expired",
        message: "Your session has expired. Please log in again.",
        code: "TOKEN_EXPIRED"
      });
    }
  } catch (error) {
    console.error('Token decode failed:', error);
    return res.status(401).json({ 
      error: "Authentication failed",
      message: "Invalid token format. Please log in again.",
      code: "TOKEN_INVALID"
    });
  }
};

async function getUserInfoFromAuth0(token) {
  if (!token) {
    throw new Error('No token provided');
  }

  try {
    const response = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.status}`);
    }
    
    const data = await response.json();
    return data.email;
  } catch (error) {
    console.error('Error fetching user info from Auth0:', error);
    return null;
  }
}

export const isAdmin = (req, res, next) => {
  // Check if user exists and has admin role
  if (!req.user || req.user.role !== 'admin') {
    console.error('Access denied: User is not an admin', {
      hasUser: !!req.user,
      role: req.user?.role
    });
    return res.status(403).json({ 
      error: "Forbidden",
      message: "Access denied. Only administrators can access this resource.",
      code: "ROLE_FORBIDDEN"
    });
  }
  next();
};
