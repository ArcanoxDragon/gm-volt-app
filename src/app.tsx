import { AsyncComponent } from "./asyncComponent";
import * as React from "react";
import {
    StyleSheet,
    View,
    ViewStyle
    } from "react-native";

import { LoginView } from "./login";
import { StatusView } from "./status";

export interface Props {}

export interface State {
    view: string;
}

type Views = {
    [ name: string ]: typeof React.Component;
}

export class GMVoltAndroidApp extends AsyncComponent<Props, State> {
    private static readonly views: Views = {
        login: LoginView,
        status: StatusView
    }

    static childContextTypes = {
        app: React.PropTypes.object
    }

    constructor() {
        super();

        this.state = {
            view: "login"
        };
    }

    getChildContext(): any {
        return {
            app: this
        };
    }

    changeView( name: string ) {
        if ( !GMVoltAndroidApp.views[ name ] ) throw new Error( `View does not exist: ${ name }` );

        this.setState( { view: name } );
    }

    render() {
        let { view } = this.state;
        let viewType = GMVoltAndroidApp.views[ view ];
        let viewComponent = React.createElement( viewType );

        return ( <View style={styles.app}>
                     { viewComponent }
                 </View> );
    }
}

type StyleSheet = { [ key: string ]: ViewStyle }
const styles = StyleSheet.create( {
    app: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#203035"
    }
} as StyleSheet );