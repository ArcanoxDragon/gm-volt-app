import "./shim.js";

import { AppRegistry } from "react-native";
import { GMVoltAndroidApp } from "./build/app.js";

AppRegistry.registerComponent( "GMVoltAndroidApp", () => GMVoltAndroidApp );