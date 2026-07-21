// react-native-css's type package (referenced by nativewind-env.d.ts) adds
// `className` props to RN components but doesn't declare *.css modules
// itself, so the side-effect import of global.css needs this ambient
// declaration to type-check.
declare module "*.css";
