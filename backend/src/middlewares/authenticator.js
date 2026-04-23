const jwt = require("jsonwebtoken");

const createError = require("../utils/errorFactory");
const User = require("../modules/users/user.model");

// define public paths
const PUBLIC_PATHS = ["/api/users/login"];
const PUBLIC_PATH_PREFIXES = ["/api-docs"];

const toPathname = (value) => {
    if (!value || typeof value !== "string") return "";
    const raw = value.split("?")[0].trim();
    if (!raw) return "";
    return raw.startsWith("/") ? raw : `/${raw}`;
};

const stripPrefix = (path, prefix) => {
    if (!path || !prefix) return path;
    const normalizedPrefix = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
    if (!normalizedPrefix) return path;
    if (path === normalizedPrefix) return "/";
    return path.startsWith(`${normalizedPrefix}/`) ? path.slice(normalizedPrefix.length) : path;
};

const collectPathCandidates = (req) => {
    const candidates = new Set();

    const directPaths = [req.path, req.originalUrl, req.url];
    directPaths.forEach((p) => {
        const pathname = toPathname(p);
        if (pathname) candidates.add(pathname);
    });

    // Some reverse proxies prepend a base path (e.g., /prod/api/...) and expose it via X-Forwarded-Prefix.
    const forwardedPrefix = toPathname(req.headers["x-forwarded-prefix"]);
    if (forwardedPrefix) {
        [...candidates].forEach((p) => {
            const stripped = stripPrefix(p, forwardedPrefix);
            if (stripped) candidates.add(stripped);
        });
    }

    // Support deployments where the gateway strips or adds the /api segment.
    [...candidates].forEach((p) => {
        if (p.startsWith("/api/")) {
            candidates.add(p.slice(4));
        } else {
            candidates.add(`/api${p}`);
        }
    });

    return [...candidates];
};

const matchesPublicPath = (path, publicPath) => {
    if (!path || !publicPath) return false;

    if (path === publicPath) return true;

    // Allow deployments that prepend a base path before /api or /api-docs.
    if (path.endsWith(publicPath)) return true;

    // Accept stripped-api variants as well (e.g. /users/login).
    if (publicPath.startsWith("/api/") && path === publicPath.slice(4)) return true;

    return false;
};

const isPublicRouteRequest = (req) => {
    const paths = collectPathCandidates(req);
    return paths.some((path) => {
        const isExactPublic = PUBLIC_PATHS.some((publicPath) =>
            matchesPublicPath(path, publicPath),
        );
        const isPublicPrefix = PUBLIC_PATH_PREFIXES.some(
            (prefix) => path.startsWith(prefix) || path.endsWith(prefix),
        );
        return isExactPublic || isPublicPrefix;
    });
};

// function that authenticates the token of the user
const authenticator = async (req, res, next) => {
    // allow public routes
    const isPublicRoute = isPublicRouteRequest(req);
    if (isPublicRoute) return next();

    // extract jwt token from cookie
    const token = req.cookies.token;
    if (!token) {
        return next(createError("Token missing", 401));
    }

    try {
        // decode the jwt token payload
        const JWT_SECRET = process.env.JWT_SECRET;
        const decodedPayload = jwt.verify(token, JWT_SECRET);

        // find the user by the id from the payload
        const currentUser = await User.findById(decodedPayload.id);
        if (!currentUser) {
            return next(createError("User doesn't exist", 401));
        }

        // add the user data to the request
        req.user = { id: decodedPayload.id, roles: decodedPayload.roles };
        console.log("User authenticated: \n", req.user);

        next();
    } catch (err) {
        return next(createError("Invalid token", 401));
    }
};

module.exports = authenticator;
