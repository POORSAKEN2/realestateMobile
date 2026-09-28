const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
const { supportPreviewTarget } = require('./config/supportPreview');
const previewTarget = supportPreviewTarget();
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === '@raze-support-preview') {
        return { type: 'sourceFile', filePath: previewTarget };
    }
    return context.resolveRequest(context, moduleName, platform);
};
config.transformer.babelTransformerPath = require.resolve(
    "react-native-svg-transformer/expo"
);

config.resolver.assetExts = config.resolver.assetExts.filter(
    (extension) => extension !== "svg"
);

config.resolver.sourceExts.push("svg");
module.exports = withNativeWind(config, { input: "./global.css" });
