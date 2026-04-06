const fs = require("fs");
const path = require("path");
const YAML = require("yamljs");

const loadYamlObject = (filePath) => {
    if (!fs.existsSync(filePath)) return {};

    const loaded = YAML.load(filePath);
    return loaded && typeof loaded === "object" ? loaded : {};
};

const mergeOpenApiDocuments = (base, extension) => {
    return {
        ...base,
        paths: {
            ...(base.paths || {}),
            ...(extension.paths || {}),
        },
        components: {
            ...(base.components || {}),
            securitySchemes: {
                ...(base.components?.securitySchemes || {}),
                ...(extension.components?.securitySchemes || {}),
            },
            parameters: {
                ...(base.components?.parameters || {}),
                ...(extension.components?.parameters || {}),
            },
            responses: {
                ...(base.components?.responses || {}),
                ...(extension.components?.responses || {}),
            },
            schemas: {
                ...(base.components?.schemas || {}),
                ...(extension.components?.schemas || {}),
            },
        },
    };
};

const resolveLocalSchemaRefs = (document, docsDir) => {
    const schemas = document.components?.schemas;
    if (!schemas || typeof schemas !== "object") return document;

    for (const [schemaName, schemaDefinition] of Object.entries(schemas)) {
        const refPath = schemaDefinition?.$ref;
        if (typeof refPath !== "string" || !refPath.startsWith("./schemas/")) continue;

        const normalizedRef = refPath.replace("./", "");
        const absoluteSchemaPath = path.join(docsDir, normalizedRef);
        const loadedSchema = loadYamlObject(absoluteSchemaPath);

        // Keep original schema definition if the target file cannot be loaded.
        if (Object.keys(loadedSchema).length === 0) continue;
        schemas[schemaName] = loadedSchema;
    }

    return document;
};

const buildOpenApiDocument = () => {
    const docsDir = __dirname;
    const routesDir = path.join(docsDir, "routes");

    let document = loadYamlObject(path.join(docsDir, "openapi.yaml"));

    if (!fs.existsSync(routesDir)) return document;

    const routeDocFiles = fs
        .readdirSync(routesDir)
        .filter((fileName) => fileName.endsWith(".yaml"));

    for (const routeDocFile of routeDocFiles) {
        const routeDocPath = path.join(routesDir, routeDocFile);
        const routeDoc = loadYamlObject(routeDocPath);
        document = mergeOpenApiDocuments(document, routeDoc);
    }

    document = resolveLocalSchemaRefs(document, docsDir);

    return document;
};

module.exports = { buildOpenApiDocument };
